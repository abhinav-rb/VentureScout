from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

from scraper import scrape_website
from ai_analyzer import analyze_startup_text
from database import insert_deal, DB_NAME

app = Flask(__name__)
CORS(app)

@app.route('/api/deals', methods=['GET'])
def get_deals():
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM deals')
        rows = cursor.fetchall()

        deals = [dict(row) for row in rows]
        conn.close()

        return jsonify({"success": True, "deals": deals}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
@app.route('/api/analyze', methods=['POST'])
def analyze_startup(): 
    data = request.get_json()
    url = data.get('url')

    if not url:
        return jsonify({"success": False, "error": "No URL provided"}),400
    print(f"Server received request to analyze: {url}")    
    
    scrape_result = scrape_website(url)
    if not scrape_result.get("success"):
        return jsonify({"success": False, "error": f"Scraping failed: {scrape_result.get('error')}"}), 400
    
    company_title = scrape_result["title"]
    scraped_content = scrape_result["content"]

    if len(scraped_content) < 100:
        return jsonify({"success": False, "error": "Not enough text on website to analyze"}), 400    
    
    ai_result = analyze_startup_text(company_title, scraped_content)
    if not ai_result:
        return jsonify({"success": False, "error": "AI Analysis failed"}), 500


    clean_domain = url.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
    logo_url = f"https://logo.clearbit.com/{clean_domain}"

    saved = insert_deal(company_title, url, ai_result, logo_url)

    if saved: 
        return jsonify({"success": True, "message": f"Successfully analyzed and saved {company_title}"}), 201
    else:
        return jsonify({"success": False, "error": "Failed to save to database (URL might already exist)"}), 400
    
@app.route('/api/deals/<int:deal_id>', methods=['PATCH'])
def update_deal_status(deal_id):
    data = request.get_json()
    new_status = data.get('status')

    if not new_status:
        return jsonify({"success": False, "error": "No new status provided"}), 400
    
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()

        cursor.execute("UPDATE deals SET status = ? WHERE id = ?", (new_status, deal_id))
        conn.commit()

        if cursor.rowcount == 0:
            conn.close()
            return jsonify({"success": False, "error": "Deal not found"}), 400
        
        conn.close()
        return jsonify({"success": True, "message": f"Deal {deal_id} updated to {new_status}"}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    # Run the app on port 5000 with debug mode enabled so it auto-reloads if we change code
    print("Starting VentureScout Backend API on http://localhost:5000")
    app.run(debug=True, port=5000)



