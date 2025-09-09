from backend.core.config import get_settings
import duckdb

settings = get_settings()
try:
    db_conn = duckdb.connect(settings.duckdb_path, read_only=True)
except Exception as e:
    raise RuntimeError(f"Failed to load DuckDB dataset from {settings.duckdb_path}") from e
