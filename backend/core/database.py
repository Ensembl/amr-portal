from backend.core.config import get_settings
import duckdb

settings = get_settings()

def get_db_connection():
    """
    FastAPI dependency for database connections.
    Creates a new connection for each request.
    """
    if "https" in settings.duckdb_path:
        conn = duckdb.connect()
        dbname = "amr_portal"
        conn.execute(f"ATTACH '{settings.duckdb_path}' AS {dbname}")
        conn.execute(f"USE {dbname}")
    else:
        conn = duckdb.connect(settings.duckdb_path, read_only=True)
    conn.execute("PRAGMA threads = 4")
    conn.execute("PRAGMA memory_limit = '2GB'")
    try:
        yield conn
    finally:
        conn.close()