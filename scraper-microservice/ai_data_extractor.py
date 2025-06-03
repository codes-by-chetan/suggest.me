import json
import requests

def main():
    # Read HTML file
    try:
        with open("detail_page.html", "r", encoding="utf-8") as file:
            html_content = file.read()
    except FileNotFoundError:
        print("❌ Error: 'movie_page.html' file not found in the current directory.")
        return

    # Build prompt for the AI model
    prompt = f"""
You are an expert in extracting structured data from messy HTML.

Your task: From the following HTML, extract where the movie is available to stream, rent, or purchase.

Return the data in the following JSON structure ONLY:

{{
  "stream": [
    {{
      "platform": "string",
      "url": "string"
    }}
  ]
}}

Here is the HTML content:

<html> {html_content} </html> """
    

    # Send request to local Ollama server running Mistral
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "mistral",
                "prompt": prompt,
                "stream": False,
                "max_tokens": 1024,
                "temperature": 0
            },
            timeout=600
        )
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"❌ Error communicating with Ollama API: {e}")
        return

    # Parse and print the response
    try:
        result = response.json()
        # The extracted text is in result["response"]
        extracted_json_str = result.get("response", "").strip()

        # Try to parse JSON from the response string
        extracted_json = json.loads(extracted_json_str)
        print("\n📦 Extracted JSON Output:\n")
        print(json.dumps(extracted_json, indent=2))
    except (json.JSONDecodeError, TypeError):
        print("\n⚠️ Warning: Could not parse JSON from model output. Here's raw response:")
        print(extracted_json_str)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    main()
