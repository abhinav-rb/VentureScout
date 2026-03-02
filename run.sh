#!/bin/bash
# Run Venture Scout scripts with the project venv.
# Usage: ./run.sh scraper    OR    ./run.sh ai_analyzer
# From project root: ./run.sh ai_analyzer

set -e
cd "$(dirname "$0")"

# Prefer project-root venv, fallback to src/venture_scout/.venv
if [ -f ".venv/bin/python" ]; then
  PYTHON=".venv/bin/python"
elif [ -f "src/venture_scout/.venv/bin/python" ]; then
  PYTHON="src/venture_scout/.venv/bin/python"
else
  echo "No venv found. Run: uv venv .venv && source .venv/bin/activate && uv pip install -e ."
  exit 1
fi

case "${1:-}" in
  scraper)
    PYTHONPATH=src $PYTHON -m venture_scout.scraper
    ;;
  ai_analyzer|ai_analyzer.py)
    PYTHONPATH=src $PYTHON -m venture_scout.ai_analyzer
    ;;
  *)
    echo "Usage: ./run.sh scraper | ai_analyzer"
    exit 1
    ;;
esac
