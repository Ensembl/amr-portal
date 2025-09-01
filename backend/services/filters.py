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

def get_table_from_filters(grouped_filters, table_columns_dict):
    for table, cols in table_columns_dict.items():
        # check if selected filters are all  in table cols
        if set(grouped_filters).issubset(cols):
            return table
    return None


def fetch_filters():
    return build_filters_config()


def filter_amr_records(payload: Payload):
    # Build column map for allowed tables
    table_columns_dict = {}
    for table in ALLOWED_TABLES:
        valid_columns = get_table_columns(table)
        table_columns_dict[table] = valid_columns

    # Gather the selected filters
    selected_filters = []
    for f in payload.selected_filters:
        selected_filters.append(f)

    # group them together and trim the first dataset name part
    grouped_filters = defaultdict(list)
    for f in payload.selected_filters:
        trimmed_filter_category = f.category.split("-")[-1]
        grouped_filters[trimmed_filter_category].append(f.value)

    # After getting the selected filters and grouping them together
    # we need to pick the dataset/table from which we fetch the data
    # based on the selected filters, for now, get_table_from_filters()
    # returns one dataset/table name only, this means that all the
    # selected filters should belong to the same dataset/table (genotype
    # or phenotype) this can be changed later
    selected_dataset = get_table_from_filters(grouped_filters, table_columns_dict)
    logger.info(f"selected_dataset: {selected_dataset}")
    logger.info(f"grouped_filters: {grouped_filters}")
    if not selected_dataset:
        raise HTTPException(
            status_code=400,
            detail="Something is wrong with the filters, double check the category values"
        )

    # Validate order column
    if payload.order_by:
        ob_col = payload.order_by.category
        if ob_col not in table_columns_dict[selected_dataset]:
            raise HTTPException(status_code=400, detail=f"Invalid order_by column: {ob_col!r}")

    where_clauses = []
    for category, values in grouped_filters.items():
        # Convert list to SQL tuple syntax: ('value1', 'value2')
        quoted_values = [f"'{v}'" for v in values]
        tuple_clause = f"({', '.join(quoted_values)})"
        where_clauses.append(f"{category} IN {tuple_clause}")

    where_sql = " AND ".join(where_clauses)

    # Build queries
    base_query = f"SELECT * FROM {selected_dataset}"
    count_query = f"SELECT COUNT(*) AS count FROM {selected_dataset}"

    if where_sql:
        base_query += f" WHERE {where_sql}"
        count_query += f" WHERE {where_sql}"

    # Execute with parameters
    try:
        logger.info(f"selected_filters: {payload.selected_filters}")
        logger.info(f"base_query: {base_query}")
        logger.info(f"count_query: {count_query}")

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
