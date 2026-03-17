# VentureScout

Deal Flow CRM & Analyzer for Venture Capital workflows.

## Overview

VentureScout is a full-stack tool that automates the early-stage deal screening workflow for Venture Capital. Paste a single startup URL and the system scrapes the site, generates an AI-driven investment memo (high-concept pitch, industry tags, bull/bear case), and drops the deal onto a drag-and-drop Kanban board.

## Features

- **One-click analysis** — submit a URL, get a full AI-generated deal card
- **Web scraping** — extracts title, meta description, and page content via BeautifulSoup
- **AI investment memos** — OpenAI generates a high-concept pitch, industry tags, and bull/bear cases
- **Kanban board** — drag-and-drop deal cards across columns: New → Outreach → Due Diligence → Pass → Invest
- **Deal detail modal** — click any card to view the full AI analysis
- **Auto logos** — fetches company logos via Clearbit with Google Favicon fallback
- **Persistent storage** — all deals saved to SQLite

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS v4
- **Backend:** Python 3.11 (Flask)
- **Database:** SQLite
- **AI/LLM:** OpenAI API (GPT-4o-mini) with Pydantic structured output
- **Scraping:** BeautifulSoup4 + Requests

## Project Structure

```
src/
├── venture_scout/          # Flask backend
│   ├── app.py              # API routes & server entry point
│   ├── scraper.py          # Website scraping logic
│   ├── ai_analyzer.py      # OpenAI integration & Pydantic model
│   └── database.py         # SQLite schema & queries
└── frontEnd/               # React frontend
    └── src/
        ├── App.jsx          # Main app (Kanban board, modal, fetch logic)
        ├── main.jsx         # React entry point
        └── index.css        # Tailwind imports
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- An [OpenAI API key](https://platform.openai.com/account/api-keys)

## Installation

```bash
# Clone the repository
git clone https://github.com/abhinav-rb/VentureScout.git
cd VentureScout

# Backend setup
uv venv .venv
source .venv/bin/activate
uv pip install -e .

# Initialize the database
python src/venture_scout/database.py

# Frontend setup
npm install --prefix src/frontEnd
```

## Running the App

You need **two terminal tabs** running simultaneously:

**Tab 1 — Start the Flask backend (port 5001):**

```bash
export OPENAI_API_KEY='sk-...'
source .venv/bin/activate
python src/venture_scout/app.py
```

**Tab 2 — Start the Vite dev server (port 5173):**

```bash
npm run dev --prefix src/frontEnd
```

Then open **http://localhost:5173** in your browser.

The Vite dev server proxies all `/api` requests to the Flask backend automatically.

## API Endpoints

- `POST /api/analyze` — submit a startup URL for AI analysis
- `GET /api/deals` — list all tracked deals
- `PATCH /api/deals/:id` — update a deal's status (e.g. drag to a new column)

## License

MIT
