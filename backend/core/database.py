from backend.core.config import get_settings
import duckdb

settings = get_settings()

def get_db_connection():
    """
    FastAPI dependency for database connections.
    Creates a new connection for each request.
    """
    conn = duckdb.connect(settings.duckdb_path, read_only=True)
    try:
        yield conn
    finally:
        conn.close()