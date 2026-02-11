# VentureScout

Deal Flow CRM & Analyzer for Venture Capital workflows.

## Overview

VentureScout is a full-stack internal tool that simulates the workflow of a Venture Capital Associate. It solves the manual tedium of data entry and initial screening—by inputting a single URL, the system automatically enriches the company profile, generates an AI-driven investment memo, and categorizes the deal.

## Features

### Smart Input (Auto-Enrichment)
- URL input that validates, fetches HTML, and extracts metadata
- Automatic logo fetching via Clearbit

### Deal Dashboard
- Kanban-style board or rich list view for tracked startups
- Status tracking: New → Outreach → Due Diligence → Pass → Invest
- Dynamic color-coding based on deal status

### AI Analyst
- Generates one-sentence "High Concept" pitch
- Industry tagging (Fintech, SaaS, etc.)
- Bull Case / Bear Case analysis

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|----------|
| Frontend | React (Vite) + Tailwind CSS | Dashboard UI |
| Backend | Python (Flask) | REST API |
| Database | SQLite (MVP) / PostgreSQL | Data persistence |
| AI/LLM | OpenAI API (GPT-4o-mini) | Summarization & classification |
| Scraping | BeautifulSoup4 + Requests | Website data extraction |

## Installation

```bash
# Clone the repository
git clone https://github.com/abhinav-rb/VentureScout.git
cd VentureScout

# Backend setup
uv venv .venv
source .venv/bin/activate
uv pip install -e .

# Frontend setup (once frontend exists)
cd frontend
npm install
```

## Usage

```bash
# Run backend
python -m venture_scout

# Run frontend (once implemented)
cd frontend && npm run dev
```

## API Endpoints

- `POST /api/analyze` - Submit a startup URL for analysis
- `GET /api/deals` - List all tracked deals
- `PATCH /api/deals/:id` - Update deal status

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
