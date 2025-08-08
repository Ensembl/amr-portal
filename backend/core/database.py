from backend.core.config import get_settings
import duckdb

settings = get_settings()
try:
    data = duckdb.read_parquet(settings.duckdb_path)
except Exception as e:
    raise RuntimeError(f"Failed to load DuckDB dataset from {settings.duckdb_path}") from e
