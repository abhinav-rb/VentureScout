from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

_ALLOWED_SCHEMES = {"http", "https"}
_MAX_RESPONSE_BYTES = 2 * 1024 * 1024  # 2 MB


def scrape_website(url: str) -> dict:
    """
    Scrape a website and return the HTML content. Basic metadata.
    """
    # --- Scheme validation (defence-in-depth, also checked in security.py) ---
    parsed = urlparse(url)
    if parsed.scheme not in _ALLOWED_SCHEMES:
        return {"success": False, "error": f"Unsupported URL scheme: {parsed.scheme}"}

    headers = {
        "User-Agent": "VentureScout/1.0 (+https://github.com/venture-scout)"
    }

    try:
        response = requests.get(
            url,
            headers=headers,
            timeout=10,
            allow_redirects=True,
            stream=True,
        )
        # Enforce max download size
        content_length = response.headers.get("Content-Length")
        if content_length and int(content_length) > _MAX_RESPONSE_BYTES:
            return {"success": False, "error": "Response too large"}

        # Read up to the limit
        raw = response.content[:_MAX_RESPONSE_BYTES]
        response.raise_for_status()
        soup = BeautifulSoup(raw, 'html.parser')
        #extract metadata
        title = soup.title.string if soup.title else "Untitled"
        meta_description = soup.find("meta", attrs={"name": "description"})
        description = (
            meta_description["content"]
            if meta_description
            else "No description found"
        )

        # Remove non-visible elements before extracting text
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        content = soup.get_text(separator=" ", strip=True)

        return {
            "success": True,
            "url": url,
            "title": title,
            "description": description,
            "content": content[:5000],  # Cap length to avoid huge OpenAI payloads
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    test_url = "https://stripe.com"
    print(f"Scraping {test_url}...\n")

    result = scrape_website(test_url)
    print(result)
