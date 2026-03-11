import requests
from bs4 import BeautifulSoup

def scrape_website(url: str) -> dict:
    """
    Scrape a website and return the HTML content. Basic metadata
    """
    #impersonate a standard browser request -- prevent getting blocked by server
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        #fetch webpage
        response = requests.get(url, headers=headers, timeout = 10)
        response.raise_for_status()
        #parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        #extract metadata
        title = soup.title.string if soup.title else "Untitled"
        meta_description = soup.find("meta", attrs={"name": "description"})
        description = meta_description["content"] if meta_description else "No description found"

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
