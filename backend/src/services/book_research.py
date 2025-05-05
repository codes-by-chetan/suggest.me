import sys
import json
import requests
from bs4 import BeautifulSoup
from googlesearch import search
import re

def search_book(book_title, author):
    query = f"{book_title} {author} book"
    results = []
    
    for url in search(query, num_results=5):
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                results.append({"url": url, "content": response.text})
        except Exception as e:
            print(f"Error fetching {url}: {e}", file=sys.stderr)
    
    return results

def extract_book_data(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    data = {
        "title": None,
        "author": None,
        "isbn": None,
        "description": None,
        "published_year": None
    }
    
    title_tag = soup.find('h1') or soup.find('title')
    if title_tag:
        data["title"] = title_tag.text.strip()
    
    isbn_pattern = r"(?:ISBN[- ]?(?:10|13)?:? )?(\d{10}|\d{13})"
    isbn_match = re.search(isbn_pattern, html_content, re.IGNORECASE)
    if isbn_match:
        data["isbn"] = isbn_match.group(1)
    
    meta_desc = soup.find('meta', attrs={'name': 'description'})
    if meta_desc:
        data["description"] = meta_desc['content'].strip()
    else:
        paragraphs = soup.find_all('p')
        if paragraphs:
            data["description"] = paragraphs[0].text.strip()[:500]
    
    year_pattern = r"(?:Published|©)\s*(\d{4})"
    year_match = re.search(year_pattern, html_content, re.IGNORECASE)
    if year_match:
        data["published_year"] = year_match.group(1)
    
    return data

def validate_data(data_list, expected_title, expected_author):
    validated_data = []
    for data in data_list:
        if (data["title"] and expected_title.lower() in data["title"].lower() and
            data["published_year"] and int(data["published_year"]) >= 1993):
            validated_data.append(data)
    return validated_data

def research_book(book_title, author):
    search_results = search_book(book_title, author)
    extracted_data = []
    for result in search_results:
        data = extract_book_data(result["content"])
        data["source"] = result["url"]
        extracted_data.append(data)
    
    validated_data = validate_data(extracted_data, book_title, author)
    
    if validated_data:
        return {
            "status": "success",
            "book": validated_data[0],
            "sources": [d["source"] for d in validated_data]
        }
    else:
        return {
            "status": "error",
            "message": "No valid data found for the book"
        }

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"status": "error", "message": "Usage: book_research.py <title> <author>"}), file=sys.stderr)
        sys.exit(1)
    
    title, author = sys.argv[1], sys.argv[2]
    result = research_book(title, author)
    print(json.dumps(result))