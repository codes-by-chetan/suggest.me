from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pyppeteer import launch
from bs4 import BeautifulSoup
import asyncio
import time
import random
from cachetools import TTLCache
import logging
import json
import spacy
from spacy.matcher import PhraseMatcher
import re
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Streaming Platforms Microservice")

# Caches keyed by site for granularity
cache = {site: TTLCache(maxsize=1000, ttl=604800) for site in ['justwatch', 'reelgood', 'rottentomatoes']}

# Load spaCy model
nlp = spacy.load("en_core_web_sm")

# ProxyScrape API configuration (hardcoded)
PROXYSCRAPE_API_KEY = "e45qzwe1l02d2k2ejhs3"
PROXYSCRAPE_API_URL = "https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=http&anonymity=elite&country=US&timeout=1000"

def get_rotating_proxy():
    """Fetch and validate a random elite HTTP proxy from ProxyScrape's API."""
    try:
        response = requests.get(
            PROXYSCRAPE_API_URL,
            headers={"Authorization": f"Bearer {PROXYSCRAPE_API_KEY}"},
            timeout=5
        )
        logger.info(f"ProxyScrape API status: {response.status_code}")
        if response.status_code == 200:
            proxies = response.text.splitlines()
            if not proxies:
                logger.warning("No proxies available from ProxyScrape")
                return None
            
            # Validate a random proxy
            for _ in range(min(3, len(proxies))):  # Try up to 3 proxies
                proxy = random.choice(proxies)
                try:
                    test_response = requests.get(
                        "https://www.google.com",
                        proxies={"http": f"http://{proxy}", "https": f"http://{proxy}"},
                        timeout=5
                    )
                    if test_response.status_code == 200:
                        logger.info(f"Valid proxy: {proxy}")
                        return f"http://{proxy}"
                    else:
                        logger.warning(f"Proxy {proxy} failed with status {test_response.status_code}")
                except requests.RequestException as e:
                    logger.warning(f"Proxy {proxy} failed validation: {str(e)}")
            logger.warning("No valid proxies found")
            return None
        else:
            logger.warning(f"ProxyScrape API returned status {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"ProxyScrape fetch error: {str(e)}")
        return None

class MovieRequest(BaseModel):
    title: str
    year: int

async def initialize_browser(proxy=None):
    """Initialize Pyppeteer browser with proxy support and enhanced stability."""
    browser_args = [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--window-size=1920,1080',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    ]
    if proxy:
        browser_args.append(f'--proxy-server={proxy}')
    
    try:
        browser = await launch(
            headless=True,
            args=browser_args,
            executablePath=None  # Use bundled Chromium
        )
        logger.info("Pyppeteer browser initialized successfully")
        return browser
    except Exception as e:
        logger.error(f"Failed to initialize browser: {str(e)}")
        raise

async def scrape_justwatch(title: str, year: int, browser) -> list:
    """Scraper for JustWatch.com."""
    search_url = f"https://www.justwatch.com/us/search?q={title.replace(' ', '+')}+{year}"
    page = None
    try:
        page = await browser.newPage()
        await page.setViewport({'width': 1920, 'height': 1080})
        await page.goto(search_url, {'waitUntil': 'networkidle2', 'timeout': 10000})
        await asyncio.sleep(5)  # Increased for reliability
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")
        
        title_link = None
        for link in soup.find_all("a", href=True):
            if title.lower() in link.get_text(strip=True).lower() and str(year) in link.get_text(strip=True):
                title_link = link
                break
        if not title_link:
            logger.warning(f"No title link found on JustWatch for {title} ({year})")
            return []
        
        detail_url = f"https://www.justwatch.com{title_link['href']}"
        await page.goto(detail_url, {'waitUntil': 'networkidle2', 'timeout': 10000})
        for _ in range(5):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1)
        
        html = await page.content()
        detail_soup = BeautifulSoup(html, "html.parser")
        platforms = []
        platform_sections = detail_soup.find_all("div", class_=re.compile(r"buybox-row", re.I))
        for section in platform_sections:
            platform_name_elem = section.find_previous("h3")
            if platform_name_elem:
                platform_name = platform_name_elem.get_text(strip=True).strip()
                if " on " in platform_name:
                    platform_name = platform_name.split(" on ")[-1].strip()
                if platform_name and platform_name.lower() not in ["today", "free"]:
                    watch_now_link = section.find("a", string=re.compile(r"watch now", re.I))
                    link = watch_now_link["href"] if watch_now_link else None
                    if link and not link.startswith("http"):
                        link = f"https://www.justwatch.com{link}"
                    platforms.append({"platform": platform_name, "link": link})
        return platforms
    except Exception as e:
        logger.error(f"JustWatch scrape error for {title} ({year}): {str(e)}")
        return []
    finally:
        if page:
            await page.close()

async def scrape_reelgood(title: str, year: int, browser) -> list:
    """Scraper for Reelgood.com."""
    search_url = f"https://reelgood.com/search?q={title.replace(' ', '+')}+{year}"
    page = None
    try:
        page = await browser.newPage()
        await page.setViewport({'width': 1920, 'height': 1080})
        await page.goto(search_url, {'waitUntil': 'networkidle2', 'timeout': 10000})
        await asyncio.sleep(5)
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")
        
        title_link = None
        for link in soup.find_all("a", href=True):
            if "/movie/" in link["href"] and title.lower() in link.get_text(strip=True).lower() and str(year) in link.get_text(strip=True):
                title_link = link
                break
        if not title_link:
            logger.warning(f"No title link found on Reelgood for {title} ({year})")
            return []
        
        detail_url = f"https://reelgood.com{title_link['href']}"
        await page.goto(detail_url, {'waitUntil': 'networkidle2', 'timeout': 10000})
        for _ in range(5):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1)
        
        html = await page.content()
        detail_soup = BeautifulSoup(html, "html.parser")
        platforms = []
        where_to_watch = detail_soup.find("div", class_=re.compile(r"where-to-watch", re.I))
        if where_to_watch:
            for p in where_to_watch.find_all("p"):
                text = p.get_text(strip=True)
                if "streaming on" in text.lower():
                    platform_names = re.findall(r"([A-Za-z0-9\s]+)(?:,|and|.)", text)
                    for name in platform_names:
                        cleaned = name.strip()
                        if cleaned:
                            platforms.append({"platform": cleaned, "link": None})
        return platforms
    except Exception as e:
        logger.error(f"Reelgood scrape error for {title} ({year}): {str(e)}")
        return []
    finally:
        if page:
            await page.close()

async def scrape_rottentomatoes(title: str, year: int, browser) -> list:
    """Scraper for RottenTomatoes.com."""
    page = None
    try:
        slug = title.lower().replace(" ", "_")
        detail_url = f"https://www.rottentomatoes.com/m/{slug}"
        page = await browser.newPage()
        await page.setViewport({'width': 1920, 'height': 1080})
        await page.goto(detail_url, {'waitUntil': 'networkidle2', 'timeout': 10000})
        await asyncio.sleep(5)
        
        html = await page.content()
        if str(year) not in html:
            search_url = f"https://www.rottentomatoes.com/search?search={title.replace(' ', '%20')}"
            await page.goto(search_url, {'waitUntil': 'networkidle2', 'timeout': 10000})
            await asyncio.sleep(5)
            html = await page.content()
            soup = BeautifulSoup(html, "html.parser")
            title_link = None
            for link in soup.find_all("a", href=True):
                if "/m/" in link["href"] and title.lower() in link.get_text(strip=True).lower() and str(year) in link.get_text(strip=True):
                    title_link = link
                    break
            if title_link:
                detail_url = f"https://www.rottentomatoes.com{title_link['href']}"
                await page.goto(detail_url, {'waitUntil': 'networkidle2', 'timeout': 10000})
                await asyncio.sleep(5)
                html = await page.content()
        
        detail_soup = BeautifulSoup(html, "html.parser")
        platforms = []
        where_to_watch = detail_soup.find("div", class_=re.compile(r"where-to-watch", re.I))
        if where_to_watch:
            for link in where_to_watch.find_all("a", class_=re.compile(r"streaming-option|affiliate", re.I)):
                platform_name = link.get_text(strip=True).strip()
                if platform_name:
                    href = link.get("href")
                    platforms.append({"platform": platform_name, "link": href})
        return platforms
    except Exception as e:
        logger.error(f"Rotten Tomatoes scrape error for {title} ({year}): {str(e)}")
        return []
    finally:
        if page:
            await page.close()

async def fetch_platforms(title: str, year: int) -> list:
    max_retries = 3
    all_platforms = set()
    debug_data = {"title": title, "year": year, "attempts": []}
    
    scrapers = {
        "justwatch": scrape_justwatch,
        "reelgood": scrape_reelgood,
        "rottentomatoes": scrape_rottentomatoes
    }
    
    proxies = [get_rotating_proxy() for _ in range(max_retries)] + [None]  # Try proxies, then no proxy
    for attempt, proxy in enumerate(proxies, 1):
        attempt_debug = {"attempt": attempt, "platforms_by_site": {}}
        attempt_debug["proxy"] = proxy
        
        if not proxy and attempt <= max_retries:
            logger.warning(f"No proxy available for attempt {attempt}, falling back to no proxy")
        
        browser = None
        try:
            await asyncio.sleep(random.uniform(2, 5))
            browser = await initialize_browser(proxy)
            
            for site, scraper_func in scrapers.items():
                cache_key = f"{title.lower()}_{year}_{site}"
                if cache_key in cache[site]:
                    logger.info(f"Cache hit for {title} ({year}) on {site}")
                    platforms = cache[site][cache_key]
                else:
                    logger.info(f"Scraping {site} for {title} ({year}), attempt {attempt}")
                    platforms = await scraper_func(title, year, browser)
                    if platforms:
                        cache[site][cache_key] = platforms
                    else:
                        logger.warning(f"No platforms found on {site}")
                
                attempt_debug["platforms_by_site"][site] = platforms
                for p in platforms:
                    all_platforms.add(p["platform"].lower())
            
            unique_platforms = []
            for lower_name in all_platforms:
                for site_platforms in attempt_debug["platforms_by_site"].values():
                    for p in site_platforms:
                        if p["platform"].lower() == lower_name:
                            unique_platforms.append(p)
                            break
            
            if unique_platforms:
                logger.info(f"Found platforms for {title} ({year}): {unique_platforms}")
                return unique_platforms
        
        except Exception as e:
            logger.error(f"Error in attempt {attempt} with proxy {proxy}: {str(e)}")
            attempt_debug["error"] = str(e)
            if browser:
                try:
                    page = await browser.newPage()
                    await page.screenshot({'path': f"debug_screenshot_attempt_{attempt}.png"})
                    with open(f"partial_page_attempt_{attempt}.html", "w", encoding="utf-8") as f:
                        f.write(await page.content())
                    await page.close()
                except Exception as e:
                    logger.warning(f"Failed to save debug files: {str(e)}")
        finally:
            if browser:
                try:
                    await browser.close()
                except Exception as e:
                    logger.warning(f"Failed to close browser: {str(e)}")
            debug_data["attempts"].append(attempt_debug)
    
    logger.error(f"No platforms found for {title} ({year}) after {len(proxies)} attempts")
    with open("debug_log.json", "w", encoding="utf-8") as f:
        json.dump(debug_data, f, indent=2)
    return []

@app.post("/streaming-platforms", response_model=dict)
async def get_streaming_platforms(request: MovieRequest):
    platforms = await fetch_platforms(request.title, request.year)
    if not platforms:
        return {
            "title": request.title,
            "year": request.year,
            "platforms": [],
            "message": "No streaming platforms found across sources."
        }
    return {"title": request.title, "year": request.year, "platforms": platforms}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("streaming_service:app", host="0.0.0.0", port=8001, reload=True)