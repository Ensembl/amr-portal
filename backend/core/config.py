from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    duckdb_path: str = "amr_v2.parquet"

    model_config = ConfigDict(env_file=".env")

@lru_cache()
def get_settings():
    return Settings()
