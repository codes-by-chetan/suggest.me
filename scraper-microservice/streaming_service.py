from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import time
import random
from cachetools import TTLCache
import logging
import os
import json
import spacy
from spacy.matcher import PhraseMatcher
import re

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Streaming Platforms Microservice")

cache = TTLCache(maxsize=1000, ttl=604800)

# Load spaCy model
nlp = spacy.load("en_core_web_sm")
matcher = PhraseMatcher(nlp.vocab)

class MovieRequest(BaseModel):
    title: str
    year: int

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

def fetch_platforms(title: str, year: int) -> list:
    cache_key = f"{title.lower()}_{year}"
    if cache_key in cache:
        logger.info(f"Cache hit for {title} ({year})")
        return cache[cache_key]

    search_url = f"https://www.justwatch.com/us/search?q={title.replace(' ', '+')}+{year}"
    max_retries = 3
    platforms = []
    driver = None
    debug_data = {"title": title, "year": year, "attempts": []}

    # Update spaCy matcher with the current title and year
    global matcher
    title_pattern = nlp(f"{title} {year}")
    matcher = PhraseMatcher(nlp.vocab)
    matcher.add("TITLE", [title_pattern])

    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
    chrome_options.binary_location = "/snap/chromium/current/usr/lib/chromium-browser/chrome"

    for attempt in range(max_retries):
        attempt_debug = {"attempt": attempt + 1}
        try:
            time.sleep(random.uniform(2, 4))
            logger.info(f"Fetching search page for {title} ({year}), attempt {attempt+1}")

            driver = webdriver.Chrome(options=chrome_options)
            driver.get(search_url)
            time.sleep(3)
            search_html = driver.page_source
            with open("search_page.html", "w", encoding="utf-8") as f:
                f.write(search_html)
            logger.info(f"Saved search page HTML to search_page.html")

            soup = BeautifulSoup(search_html, "html.parser")
            all_links = soup.find_all("a", href=True)
            attempt_debug["all_links"] = [f"{link.get_text(strip=True)[:100]} (href: {link['href']})" for link in all_links[:10]]

            title_link = None
            for link in all_links:
                combined_text = " ".join(link.get_text(strip=True).lower().split())
                if title.lower() in combined_text and str(year) in combined_text:
                    title_link = link
                    attempt_debug["title_source"] = "HTML match"
                    break

            if not title_link:
                title_slug = title.lower().replace(" ', '-")
                for link in all_links:
                    if title_slug in link["href"].lower() and str(year) in link["href"].lower():
                        title_link = link
                        attempt_debug["title_source"] = "Href match"
                        break

            if not title_link:
                doc = nlp(search_html)
                matches = matcher(doc)
                for match_id, start, end in matches:
                    span = doc[start:end]
                    for token in span:
                        element = token.ancestor
                        while element and element.name != "a":
                            element = element.parent
                        if element and element.name == "a" and element.has_attr("href"):
                            title_link = element
                            attempt_debug["title_source"] = "spaCy match"
                            break
                    if title_link:
                        break

            if not title_link:
                logger.error(f"No title link found for {title} ({year})")
                attempt_debug["error"] = "No title link found"
                debug_data["attempts"].append(attempt_debug)
                break

            attempt_debug["title_link"] = str(title_link)[:500]
            attempt_debug["title_link_text"] = title_link.get_text(strip=True)[:200]
            attempt_debug["title_link_href"] = title_link["href"]
            logger.info(f"Title link HTML: {str(title_link)[:500]}")

            parent_container = title_link.find_parent("div")
            if parent_container:
                attempt_debug["parent_container"] = str(parent_container)[:1000]
                logger.info(f"Parent container HTML: {str(parent_container)[:500]}")
            else:
                attempt_debug["parent_container"] = "Not found"
                logger.info("No parent container found")

            detail_url = f"https://www.justwatch.com{title_link['href']}"
            logger.info(f"Navigating to detail page: {detail_url}")
            attempt_debug["detail_url"] = detail_url

            time.sleep(random.uniform(1, 2))
            driver.get(detail_url)
            # Scroll multiple times to trigger dynamic content
            for _ in range(10):  # More aggressive scrolling
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)
            # Handle consent popup if present
            try:
                consent_button = driver.find_element(By.XPATH, "//button[contains(text(), 'I agree')]")
                consent_button.click()
                time.sleep(1)
            except:
                logger.info("No consent popup found")

            # Wait for platform sections or summary with more robust conditions
            try:
                WebDriverWait(driver, 60).until(  # Increased timeout to 60s
                    EC.any_of(
                        EC.presence_of_element_located((By.CSS_SELECTOR, "div[class*='buybox-row']")),
                        EC.presence_of_element_located((By.XPATH, "//p[contains(text(), 'streaming: where to watch online')]")),
                        EC.presence_of_element_located((By.XPATH, "//a[contains(translate(text(), 'WATCH NOW', 'watch now'), 'watch now')]"))
                    )
                )
            except Exception as e:
                logger.warning(f"WebDriverWait failed: {str(e)}. Proceeding with available HTML.")
                driver.save_screenshot(f"debug_screenshot_attempt_{attempt+1}.png")
                logger.info(f"Saved screenshot to debug_screenshot_attempt_{attempt+1}.png")

            detail_html = driver.page_source
            with open("detail_page.html", "w", encoding="utf-8") as f:
                f.write(detail_html)
            logger.info(f"Saved detail page HTML to detail_page.html")

            # Clean HTML to handle potential parsing issues
            detail_soup = BeautifulSoup(detail_html, "html.parser")
            logger.info(f"Raw HTML snippet: {detail_html[:1000]}")  # Log raw HTML to debug
            platforms = []

            # Log all divs with buybox-row to debug
            all_divs = detail_soup.find_all("div")
            buybox_divs = [div for div in all_divs if 'buybox-row' in ' '.join(div.get('class', []))]
            logger.info(f"Found {len(buybox_divs)} divs with 'buybox-row' in class: {[str(div)[:200] for div in buybox_divs]}")

            # Method 1: Find platform sections and extract "Watch Now" links
            platform_sections = detail_soup.find_all("div", class_=re.compile(r"buybox-row", re.I))
            logger.info(f"Found {len(platform_sections)} platform sections")
            for section in platform_sections:
                logger.info(f"Raw platform section: {str(section)[:500]}")
                # Extract platform name from <h3> or nearby text
                platform_name_elem = section.find_previous("h3")
                platform_name = None
                if platform_name_elem:
                    platform_name = platform_name_elem.get_text(strip=True).strip()
                    logger.info(f"Found platform name element: {platform_name}")
                    if "Streaming details for" in platform_name:
                        platform_name = platform_name.split(" on ")[-1].strip()
                    elif " on " in platform_name:
                        platform_name = platform_name.split(" on ")[-1].strip()
                if not platform_name or "today" in platform_name.lower() or "free" in platform_name.lower():
                    logger.warning(f"Skipping invalid platform name: {platform_name}")
                    continue

                # Find the "Watch Now" link
                watch_now_link = section.find("a", string=re.compile(r"watch now", re.I))
                platform_entry = {"platform": platform_name}
                if watch_now_link and watch_now_link.get("href"):
                    platform_link = watch_now_link["href"]
                    if not platform_link.startswith("http"):
                        platform_link = f"https://www.justwatch.com{platform_link}"
                    platform_entry["link"] = platform_link
                else:
                    logger.warning(f"No 'Watch Now' link found for platform: {platform_name}")
                    platform_entry["link"] = None

                if platform_name and platform_name not in [p["platform"] for p in platforms]:
                    platforms.append(platform_entry)
                    logger.info(f"Added platform: {platform_name} with link: {platform_entry['link']}")
                    attempt_debug.setdefault("platform_strings", []).append(f"{platform_name}: {platform_entry['link']}")

            # Method 2: Fallback to summary section
            if not platforms:
                logger.info("No platforms found in detailed sections, falling back to summary section")
                summary_section = detail_soup.find("p", string=re.compile(r"streaming: where to watch online", re.I))
                if summary_section:
                    summary_text = summary_section.get_text(strip=True)
                    logger.info(f"Found summary section: {summary_text[:200]}")
                    attempt_debug["summary_section"] = summary_text[:1000]
                    # Extract platforms from the streaming sentence
                    streaming_match = re.search(r"streaming on\s*([\w\s,]+?)(?:\s*\.|It is also possible)", summary_text, re.IGNORECASE)
                    if streaming_match:
                        streaming_platforms = [p.strip() for p in streaming_match.group(1).split(",") if p.strip()]
                        for platform in streaming_platforms:
                            if platform and platform not in [p["platform"] for p in platforms]:
                                platform_entry = {"platform": platform, "link": None}
                                # Try to find the link from the corresponding section
                                platform_section = detail_soup.find("div", class_=re.compile(r"buybox-row", re.I), string=re.compile(platform, re.I))
                                if platform_section:
                                    watch_now_link = platform_section.find("a", string=re.compile(r"watch now", re.I))
                                    if watch_now_link and watch_now_link.get("href"):
                                        platform_link = watch_now_link["href"]
                                        if not platform_link.startswith("http"):
                                            platform_link = f"https://www.justwatch.com{platform_link}"
                                        platform_entry["link"] = platform_link
                                platforms.append(platform_entry)
                                logger.info(f"Added platform from summary: {platform} with link: {platform_entry.get('link')}")

            # Method 3: Fallback to direct link extraction
            if not platforms:
                logger.info("No platforms found in summary, falling back to direct link extraction")
                watch_now_links = detail_soup.find_all("a", string=re.compile(r"watch now", re.I))
                logger.info(f"Found {len(watch_now_links)} 'Watch Now' links")
                for link in watch_now_links:
                    parent_section = link.find_parent("div", class_=re.compile(r"buybox-row", re.I))
                    if parent_section:
                        platform_name_elem = parent_section.find_previous("h3")
                        platform_name = None
                        if platform_name_elem:
                            platform_name = platform_name_elem.get_text(strip=True).strip()
                            if "Streaming details for" in platform_name:
                                platform_name = platform_name(" on ")[-1].strip()
                            elif " on " in platform_name:
                                platform_name = platform_name.split(" on ")[-1].strip()
                        if platform_name and "today" not in platform_name.lower() and "free" not in platform_name.lower():
                            platform_link = link["href"]
                            if not platform_link.startswith("http"):
                                platform_link = f"https://www.justwatch.com{platform_link}"
                            platform_entry = {"platform": platform_name, "link": platform_link}
                            if platform_name not in [p["platform"] for p in platforms]:
                                platforms.append(platform_entry)
                                logger.info(f"Added platform from direct link: {platform_name} with link: {platform_link}")
                                attempt_debug.setdefault("platform_strings", []).append(f"{platform_name}: {platform_link}")

            logger.info(f"Found platforms for {title} ({year}): {platforms}")
            attempt_debug["platforms"] = platforms
            debug_data["attempts"].append(attempt_debug)
            if platforms:  # Only cache if platforms are found
                cache[cache_key] = platforms
                return platforms
            else:
                logger.warning("No platforms found, skipping cache to allow retry")
                return []

        except Exception as e:
            logger.error(f"Error for {title} ({year}), attempt {attempt+1}: {str(e)}")
            attempt_debug["error"] = str(e)
            if driver:
                partial_html = driver.page_source
                with open(f"partial_detail_page_attempt_{attempt+1}.html", "w", encoding="utf-8") as f:
                    f.write(partial_html)
                logger.info(f"Saved partial HTML to partial_detail_page_attempt_{attempt+1}.html")
                driver.save_screenshot(f"debug_screenshot_attempt_{attempt+1}.png")
                logger.info(f"Saved screenshot to debug_screenshot_attempt_{attempt+1}.png")
            debug_data["attempts"].append(attempt_debug)
            time.sleep(2 ** attempt)
        finally:
            if driver:
                try:
                    driver.quit()
                except Exception as e:
                    logger.warning(f"Failed to quit driver: {str(e)}")

    logger.error(f"No platforms found for {title} ({year}) after {max_retries} attempts")
    with open("debug_log.json", "w", encoding="utf-8") as f:
        json.dump(debug_data, f, indent=2)
    logger.info("Saved debug data to debug_log.json")
    return []

@app.post("/streaming-platforms", response_model=dict)
async def get_streaming_platforms(request: MovieRequest):
    platforms = fetch_platforms(request.title, request.year)
    if not platforms:
        logger.info(f"No platforms found for {request.title} ({request.year})")
        return {
            "title": request.title,
            "year": request.year,
            "platforms": [],
            "message": "No streaming platforms found or request was blocked."
        }
    return {"title": request.title, "year": request.year, "platforms": platforms}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("streaming_service:app", host="0.0.0.0", port=8001, reload=True)