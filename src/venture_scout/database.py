import json
import logging
import sqlite3
from contextlib import contextmanager

logger = logging.getLogger(__name__)

DB_NAME = "deals.db"


@contextmanager
def get_db_connection():
    """Yield a SQLite connection that is always closed on exit."""
    conn = sqlite3.connect(DB_NAME)
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    with get_db_connection() as conn:
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
    logger.info(
        "Database initialized. Table 'deals' ready in %s.",
        DB_NAME,
    )


def insert_deal(company_name: str, url: str, ai_data: dict, logo_url: str = "") -> bool:
    with get_db_connection() as conn:
        try:
            cursor = conn.cursor()
            tags_json = json.dumps(ai_data["industry_tags"])

            cursor.execute(
                '''
                INSERT INTO deals (
                    company_name, url, logo_url,
                    high_concept, industry_tags,
                    bull_case, bear_case
                )
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
            logger.info("Successfully saved %s to the database.", company_name)
            return True
        except sqlite3.IntegrityError:
            logger.warning("Deal with URL %s already exists in the database.", url)
            return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    init_db()
