import os
from openai import OpenAI
from pydantic import BaseModel, Field

class DealAnalysis(BaseModel):

    high_concept: str = Field(..., description="A one-sentence pitch for the startup")
    industry_tags: list[str] = Field(description = "1 to 3 relevant industry tags for the startup.")
    bull_case : str = Field(description = "A short paragraph explaining why this startup could be successful.")
    bear_case : str = Field(description = "A short paragraph explaining the biggests risks or why this startup could fail.")

def _get_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or not api_key.strip():
        raise ValueError(
            "OPENAI_API_KEY is not set. Set it with: export OPENAI_API_KEY='sk-...' "
            "(get your key at https://platform.openai.com/account/api-keys)"
        )
    # Strip Cursor/VSCode template braces if accidentally included
    key = api_key.strip().removeprefix("{{").removesuffix("}}").strip()
    return OpenAI(api_key=key)

def analyze_startup_text(company_name: str, scraped_text: str) -> dict | None:
    print(f"Sending {company_name} data to OpenAI for analysis...")

    system_prompt = (
        "You are an expert Venture Capital Analyst. "
        "Read the following scraped website text from a startup and extract the core business model, value proposition, and risks. "
        "Be concise, analytical, and objective."
    )

    try:
        client = _get_client()
        response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Startup Name: {company_name}\n\nWebsite Content:\n{scraped_text}"},
            ],
            response_format=DealAnalysis,
        )
        analysis_result = response.choices[0].message.parsed
        if analysis_result is None:
            print("OpenAI returned no parsed result.")
            return None
        return analysis_result.model_dump()
    except ValueError as e:
        print(f"Configuration error: {e}")
        return None
    except Exception as e:
        err_type = type(e).__name__
        print(f"Error during OpenAI API call ({err_type}): {e}")
        if "Connection" in err_type or "connection" in str(e).lower():
            print(
                "  Hint: Check your network (VPN, firewall, proxy). "
                "Try: curl -s https://api.openai.com/v1/models"
            )
        return None


if __name__ == "__main__":
    fake_scraped_text = """
    Financial infrastructure for the internet. Millions of businesses rely on Stripe's platform to accept payments, send payouts, and manage their customers.
    """

    result = analyze_startup_text("Stripe", fake_scraped_text)
    if result:
        print("\nAnalysis Complete ---")
        print(f"Pitch: {result['high_concept']}")
        print(f"Tags: {result['industry_tags']}")
        print(f"Bull Case: {result['bull_case']}")
        print(f"Bear Case: {result['bear_case']}")
    else:
        print("Failed to analyze startup text.")