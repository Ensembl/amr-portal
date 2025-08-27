from collections import defaultdict
import numpy as np
from functools import lru_cache
from fastapi import HTTPException
import logging

from backend.core.database import db_conn
from backend.models.payload import Payload
from backend.services.serializer import serialize_amr_record
from backend.core.filters_config_parser import build_filters_config

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Whitelist as fallback
ALLOWED_TABLES = {"phenotype", "genotype"}

@lru_cache(maxsize=1)
def get_valid_tables():
    try:
        tables_result = db_conn.query("SHOW TABLES").fetchdf()
        return set(tables_result['name'].tolist())
    except Exception as e:
        print(f"Warning: Could not fetch tables from database: {e}")
        return ALLOWED_TABLES

@lru_cache(maxsize=32)
def get_table_columns(table_name: str):
    try:
        columns_result = db_conn.query(f"PRAGMA table_info({table_name})").fetchdf()
        return set(columns_result['name'].tolist())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get columns for table: {table_name}")


def fetch_filters():
    return build_filters_config()


def filter_amr_records(payload: Payload):
    # Validate dataset/table name
    valid_tables = get_valid_tables()  # not used for now
    if payload.dataset not in ALLOWED_TABLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid dataset: '{payload.dataset}'. Available datasets: {list(ALLOWED_TABLES)}"
        )

    # Get valid columns from the database
    valid_columns = get_table_columns(payload.dataset)

    # Validate each filter category passed by the user before processing
    for f in payload.selected_filters:
        if f.category not in valid_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid filter category: '{f.category}'. Valid columns are: {valid_columns}"
            )

    # Validate order column
    if payload.order_by and payload.order_by.category not in valid_columns:
        raise HTTPException(status_code=400, detail=f"Invalid column for ordering: '{payload.order_by.category}'")

    grouped_filters = defaultdict(list)
    where_clauses = []

    for f in payload.selected_filters:
        grouped_filters[f.category].append(f.value)

    for category, values in grouped_filters.items():
        # Convert list to SQL tuple syntax: ('value1', 'value2')
        quoted_values = [f"'{v}'" for v in values]
        tuple_clause = f"({', '.join(quoted_values)})"
        where_clauses.append(f"{category} IN {tuple_clause}")

    where_sql = " AND ".join(where_clauses)

    # Build queries
    base_query = f"SELECT * FROM {payload.dataset}"
    count_query = f"SELECT COUNT(*) AS count FROM {payload.dataset}"

    if where_sql:
        base_query += f" WHERE {where_sql}"
        count_query += f" WHERE {where_sql}"

    # Execute with parameters
    try:
        # For debugging, print the query and parameters
        logger.info(f"Fetching {payload.dataset} records")
        logger.info(f"Filters: {payload.selected_filters}")
        logger.info(f"Base query: {base_query}")
        logger.info(f"Count query: {count_query}")
        # print(f"Count query: {count_query}")

        total_hits = db_conn.execute(count_query).fetchone()[0]

        # Add pagination (LIMIT/OFFSET values can be parameterized in some databases)
        offset = (payload.page - 1) * payload.per_page
        if payload.order_by:
            base_query += f" ORDER BY {payload.order_by.category} {payload.order_by.order}"
        base_query += f" LIMIT {payload.per_page} OFFSET {offset}"

        res_df = db_conn.execute(base_query).fetchdf()
        res_df = res_df.replace({np.nan: None, np.inf: None, -np.inf: None})

        result = [serialize_amr_record(row) for _, row in res_df.iterrows()]

        return {
            "meta": {
                "total_hits": total_hits,
                "page": payload.page,
                "per_page": payload.per_page,
            },
            "data": result
        }

    except Exception as e:
        logger.error(f"Database query failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database query failed, see the logs for more details")
