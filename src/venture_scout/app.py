import logging
import os
import sqlite3

from ai_analyzer import analyze_startup_text
from database import get_db_connection, insert_deal
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from scraper import scrape_website
from security import DealStatus, require_api_key, validate_url

logger = logging.getLogger(__name__)

app = Flask(__name__)

# --- CORS: restrict origins (configure via VS_CORS_ORIGINS env var) ----------
_allowed_origins = os.getenv("VS_CORS_ORIGINS", "http://localhost:5173").split(",")
CORS(app, origins=_allowed_origins)

# --- Rate limiting -----------------------------------------------------------
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["60 per minute"],
    storage_uri="memory://",
)

@app.route('/api/deals', methods=['GET'])
@require_api_key
def get_deals():
    try:
        with get_db_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM deals')
            rows = cursor.fetchall()
            deals = [dict(row) for row in rows]
        return jsonify({"success": True, "deals": deals}), 200
    except Exception:
        logger.exception("Failed to fetch deals")
        return jsonify({"success": False, "error": "Internal server error"}), 500
@app.route('/api/analyze', methods=['POST'])
@require_api_key
@limiter.limit("10 per minute")
def analyze_startup():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON body"}), 400

    url = data.get('url', '').strip()
    if not url:
        return jsonify({"success": False, "error": "No URL provided"}), 400

    # --- URL validation (SSRF prevention) ---
    url_ok, url_err = validate_url(url)
    if not url_ok:
        return jsonify({"success": False, "error": url_err}), 400

    logger.info("Received request to analyze: %s", url)

    scrape_result = scrape_website(url)
    if not scrape_result.get("success"):
        err = scrape_result.get("error")
        return jsonify(
            {"success": False, "error": f"Scraping failed: {err}"}
        ), 400

    company_title = scrape_result["title"]
    scraped_content = scrape_result["content"]

    if len(scraped_content) < 100:
        return jsonify(
            {"success": False, "error": "Not enough text to analyze"}
        ), 400

    ai_result = analyze_startup_text(company_title, scraped_content)
    if not ai_result:
        return jsonify({"success": False, "error": "AI analysis failed"}), 500

    clean_domain = (
        url.replace("https://", "")
        .replace("http://", "")
        .replace("www.", "")
        .split("/")[0]
    )
    logo_url = f"https://logo.clearbit.com/{clean_domain}"

    saved = insert_deal(company_title, url, ai_result, logo_url)

    if saved:
        return jsonify({
            "success": True,
            "message": f"Analyzed and saved {company_title}",
        }), 201
    else:
        return jsonify({
            "success": False,
            "error": "Failed to save (URL might already exist)",
        }), 400

@app.route('/api/deals/<int:deal_id>', methods=['PATCH'])
@require_api_key
def update_deal_status(deal_id):
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON body"}), 400

    new_status = data.get('status')
    if not new_status:
        return jsonify({"success": False, "error": "No new status provided"}), 400

    # --- Status validation ---
    if new_status not in DealStatus.values():
        return jsonify({
            "success": False,
            "error": f"Invalid status. Must be one of: {DealStatus.values()}",
        }), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE deals SET status = ? WHERE id = ?",
                (new_status, deal_id),
            )
            conn.commit()

            if cursor.rowcount == 0:
                return jsonify({"success": False, "error": "Deal not found"}), 404

        return jsonify({
            "success": True,
            "message": f"Deal {deal_id} updated to {new_status}",
        }), 200

    except Exception:
        logger.exception("Failed to update deal %s", deal_id)
        return jsonify({"success": False, "error": "Internal server error"}), 500


if __name__ == '__main__':
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    host = os.getenv("VS_HOST", "127.0.0.1")
    port = int(os.getenv("VS_PORT", "5001"))
    print(f"Starting VentureScout Backend API on http://{host}:{port}")
    app.run(debug=debug, port=port, host=host)



