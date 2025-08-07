import duckdb

# Load DuckDB data into memory
data = duckdb.read_parquet("amr_v2.parquet")