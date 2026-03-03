from .scraper import scrape_website
from .ai_analyzer import analyze_startup_text

def run_full_analysis(url: str):
    
    print(f" --- Starting Pipeline for {url} ---")
    scrape_result = scrape_website(url)

    if not scrape_result.get("success"):
        print(f"Scraping failed: {scrape_result.get('error')}")
        return
    print (f" Successfully scraped! Found title: '{scrape_result['title']}'")

    company_title = scrape_result["title"]
    scraped_content = scrape_result["description"]

    if len(scraped_content) < 100:
        print("Not enough text extracted from the website to perform analysis.")
        return
    
    print ("Sending data to AI...")
    ai_result = analyze_startup_text(company_title, scraped_content)

    if not ai_result:
        print (" AI analysis failed.")
        return
    
    print("\n--- Final VentureScout Report ---")
    print(f"Company: {company_title}")
    print(f"URL: {url}")
    print(f"Pitch: {ai_result['high_concept']}")
    print(f"Tags: {', '.join(ai_result['industry_tags'])}")
    print(f"Bull Case: {ai_result['bull_case']}")
    print(f"Bear Case: {ai_result['bear_case']}")
    print("--------------------------------\n")

if __name__ == "__main__":
    test_url = "https://vercel.com"
    run_full_analysis(test_url)