from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    duckdb_path: str = "amr_v2.parquet"

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
