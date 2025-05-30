from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
import time
import random
from cachetools import TTLCache
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Streaming Platforms Microservice")

cache = TTLCache(maxsize=1000, ttl=604800)

class MovieRequest(BaseModel):
    title: str
    year: int

def fetch_platforms(title: str, year: int) -> list:
    cache_key = f"{title.lower()}_{year}"
    if cache_key in cache:
        logger.info(f"Cache hit for {title} ({year})")
        return cache[cache_key]

    search_url = f"https://www.justwatch.com/us/search?q={title.replace(' ', '+')}+{year}"
    max_retries = 3
    platforms = []
    driver = None

    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")
    chrome_options.binary_location = "/snap/chromium/current/usr/lib/chromium-browser/chrome"

    for attempt in range(max_retries):
        try:
            time.sleep(random.uniform(5, 10))
            logger.info(f"Fetching search page for {title} ({year}), attempt {attempt+1}")

            driver = webdriver.Chrome(options=chrome_options)
            driver.get(search_url)
            time.sleep(5)  # Wait for JS to load

            search_html = driver.page_source
            with open("search_page.html", "w", encoding="utf-8") as f:
                f.write(search_html)
            logger.info(f"Saved search page HTML to search_page.html")

            soup = BeautifulSoup(search_html, "html.parser")
            # Find the title element
            title_element = soup.find(lambda tag: tag.name == "div" and title.lower() in tag.get_text().lower() and str(year) in tag.get_text())
            if not title_element:
                logger.error(f"No title element found for {title} ({year})")
                break

            # Log the HTML structure around the title
            logger.info(f"Title element HTML: {str(title_element)[:500]}")  # Limit to 500 chars for readability

            # Find the nearest "Watch Now" link
            watch_now_link = title_element.find_next("a", string=lambda text: "watch now" in str(text).lower())
            if not watch_now_link:
                logger.error(f"No 'Watch Now' link found for {title} ({year})")
                break

            detail_url = f"https://www.justwatch.com{watch_now_link['href']}"
            logger.info(f"Navigating to detail page: {detail_url}")

            time.sleep(random.uniform(2, 5))
            driver.get(detail_url)
            time.sleep(5)  # Wait for JS to load

            detail_html = driver.page_source
            with open("detail_page.html", "w", encoding="utf-8") as f:
                f.write(detail_html)
            logger.info(f"Saved detail page HTML to detail_page.html")

            detail_soup = BeautifulSoup(detail_html, "html.parser")
            for elem in detail_soup.select(".price-comparison__grid__row--stream .price-comparison__grid__row__holder a"):
                platform = elem.get("title") or elem.get_text(strip=True)
                if platform and platform not in platforms:
                    platforms.append(platform)

            logger.info(f"Found platforms for {title} ({year}): {platforms}")
            cache[cache_key] = platforms
            driver.quit()
            return platforms

        except Exception as e:
            logger.error(f"Error for {title} ({year}), attempt {attempt+1}: {str(e)}")
            time.sleep(2 ** attempt)
        finally:
            if driver:
                driver.quit()

    logger.error(f"No platforms found for {title} ({year}) after {max_retries} attempts")
    cache[cache_key] = []
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