# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

VentureScout is a Deal Flow CRM & Analyzer for Venture Capital workflows. It automates company profile enrichment and AI-driven investment memo generation from a single URL input.

### Tech Stack
- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Python 3.11 (Flask) for REST API
- **Database**: SQLite (MVP) / PostgreSQL
- **AI/LLM**: OpenAI API (GPT-4o-mini or GPT-3.5-turbo)
- **Scraping**: BeautifulSoup4 + Requests

## Development Commands

```bash
# Backend setup
uv venv .venv
source .venv/bin/activate
uv pip install -e .

# Run backend
python -m venture_scout

# Run tests
pytest
pytest tests/test_example.py::test_function_name -v

# Lint and format
ruff check .
ruff format .
ruff check --fix .

# Frontend (once implemented)
cd frontend && npm install
cd frontend && npm run dev
```

## Architecture

### Data Flow
1. User submits startup URL via React frontend
2. `POST /api/analyze` hits Flask backend
3. BeautifulSoup scrapes `<title>`, `<meta description>`, and page text
4. OpenAI API generates summary, industry tag, and bull/bear cases
5. Structured data saved to SQLite/PostgreSQL
6. Frontend receives and displays the new deal card

### API Endpoints
- `POST /api/analyze` - Submit URL for analysis
- `GET /api/deals` - List all deals
- `PATCH /api/deals/:id` - Update deal status

### Deal Statuses
New → Outreach → Due Diligence → Pass → Invest

## Code Structure

```
src/venture_scout/     # Flask backend (src layout)
├── __init__.py        # Package version
└── __main__.py        # CLI entry point
tests/                 # pytest + pytest-asyncio
frontend/              # React + Vite + Tailwind (to be created)
```

## Code Style

- **Backend**: ruff (line-length: 88, Python 3.11 target)
- **Lint rules**: E (errors), F (pyflakes), I (isort), W (warnings)
- **Testing**: pytest with `asyncio_mode = "auto"`
- **Type checking**: mypy or pyright
