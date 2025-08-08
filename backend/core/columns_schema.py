from __future__ import annotations
import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

SCHEMA_PATH = Path(__file__).parent / "columns_schema.json"

@lru_cache()
def get_columns_schema() -> Dict[str, Any]:
    return json.loads(SCHEMA_PATH.read_text())

@lru_cache()
def get_columns_list() -> List[Dict[str, Any]]:
    return get_columns_schema()["columns"]

@lru_cache()
def get_column_meta_map() -> Dict[str, Dict[str, Any]]:
    return {c["id"]: c for c in get_columns_list()}

@lru_cache()
def get_sortable_columns() -> set[str]:
    return {c["id"] for c in get_columns_list() if c.get("sortable")}