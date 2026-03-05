import sqlite3
import json

DB_NAME = "deals.db"


def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        url TEXT UNIQUE NOT NULL,
        logo_url TEXT,
        high_concept TEXT,
        industry_tags TEXT,
        bull_case TEXT,
        bear_case TEXT,
        status TEXT DEFAULT 'New',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    conn.commit()
    conn.close()

    print(f"Database initialized successfully. Table 'deals' ready in {DB_NAME}.")

def insert_deal(company_name: str, url: str, ai_data: dict, logo_url: str = "") -> bool:
    conn = sqlite3.connect(DB_NAME)
    try:
        cursor = conn.cursor()
        tags_json = json.dumps(ai_data["industry_tags"])

        cursor.execute(
            '''
            INSERT INTO deals (company_name, url, logo_url, high_concept, industry_tags, bull_case, bear_case)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                company_name,
                url,
                logo_url,
                ai_data["high_concept"],
                tags_json,
                ai_data["bull_case"],
                ai_data["bear_case"],
            ),
        )
        conn.commit()
        print(f"Successfully saved {company_name} to the database.")
        return True
    except sqlite3.IntegrityError:
        print(f"Error: deal with URL {url} already exists in the database.")
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    init_db()