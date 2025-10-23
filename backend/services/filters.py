import csv
import io
import json
import os
import tempfile
from collections import defaultdict

import duckdb
import numpy as np
from functools import lru_cache
from fastapi import HTTPException
from fastapi.responses import StreamingResponse, FileResponse
import logging

from backend.core.database import db_conn
from backend.models.payload import Payload
from backend.services.serializer import serialize_amr_record
from backend.core.filters_config_parser import build_filters_config

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@lru_cache(maxsize=32)
def get_table_columns(table_name: str):
    try:
        columns_result = db_conn.query(f"PRAGMA table_info({table_name})").fetchdf()
        return set(columns_result['name'].tolist())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get columns for table: {table_name}")

def check_selected_filters(grouped_filters, valid_columns):
    if set(grouped_filters).issubset(valid_columns):
        return True
    return False

def get_dataset_from_view(view_id: int):
    dataset_from_view_query = f"SELECT DISTINCT (dataset_name) FROM view_categories WHERE view_id = {view_id};"
    try:
        dataset = db_conn.execute(dataset_from_view_query).fetchone()[0]
        return dataset
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get dataset from view ID: {view_id}")

def get_display_column_details(view_id: int):
    """Retrieves the display columns associated with a specific view ID from the database.

    This function queries the database to get the column names that should be displayed
    for a given view ID. It joins multiple tables (view, view_column, and column_definition)
    to get the full column names and orders them by rank.

    Args:
        view_id (int): The ID of the view to get columns for.

    Returns:
        DataFrame: Pandas dataframe containing all column definitions for a given view.
             Includes fields fullname, name, type, sortable, url, delimiter

    Raises:
        HTTPException: If there is an error retrieving the columns from the database,
            with status code 400 and an error message.
    TODO: Think of how to refactor this function and _build_columns_per_view(), they have some logic in common.
    """

    columns_to_display_query = f"""
        SELECT cd.fullname, cd.name, cd.type, cd.sortable, cd.url, cd.delimiter
        FROM view as v
            JOIN view_column vc on v.view_id = vc.view_id
            JOIN column_definition cd on vc.column_id = cd.column_id
        WHERE v.view_id = {view_id}
        ORDER BY vc.rank;
    """
    try:
        columns = db_conn.execute(columns_to_display_query).fetchdf()

        return columns
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to get columns to display from view ID: {view_id}")

def quote_column_name(column_name):
    """Quote column names."""
    return f'"{column_name}"'

def fetch_filters():
    return build_filters_config()


def filter_amr_records(payload: Payload):

    selected_view_id = payload.view_id
    # Check if the view_id is specified
    if not selected_view_id:
        raise HTTPException(
            status_code=400,
            detail="Please specify a view ID to filter by."
        )

    # Now we use the selected view to infer which dataset to query data from
    selected_dataset = get_dataset_from_view(selected_view_id)

    valid_columns = get_table_columns(selected_dataset)
    # not all valid columns are eventually displayed
    # We need to keep only the ones we are interested
    columns_to_display = get_display_column_details(selected_view_id)

    # This will be used below in the SQL query to select only columns we are interested in
    # Properly quote column names for SQL query
    quoted_columns = [quote_column_name(col) for col in columns_to_display["name"]]
    columns_to_display_str = ", ".join(quoted_columns)
    
    # Build dict of column details for serializer
    columns_to_display_dict = columns_to_display.to_dict('records')
    display_column_details = {
        r["fullname"]:r for r in columns_to_display_dict
    }
    
    # Gather the selected filters
    selected_filters = []
    for f in payload.selected_filters:
        selected_filters.append(f)

    # group them together and trim the first dataset name part
    grouped_filters = defaultdict(list)
    for f in payload.selected_filters:
        trimmed_filter_category = f.category.split("-")[-1]
        grouped_filters[trimmed_filter_category].append(f.value)

    # After getting the selected filters and grouping them together,
    # we need to check if they are valid and do exist in the selected
    # dataset, that's the job of check_selected_filters()
    are_filters_valid = check_selected_filters(grouped_filters, valid_columns)
    logger.info(f"are_filters_valid: {are_filters_valid}")
    logger.info(f"selected_view_id: {selected_view_id}")
    logger.info(f"selected_dataset: {selected_dataset}")
    logger.info(f"grouped_filters: {grouped_filters}")
    logger.info(f"quoted_columns: {quoted_columns}")

    if not are_filters_valid:
        raise HTTPException(
            status_code=400,
            detail="Something is wrong with the filters, double check the category values."
        )

    # Validate order column
    if payload.order_by:
        order_by_col = payload.order_by.category.split("-")[-1]
        if order_by_col not in valid_columns:
            raise HTTPException(status_code=400, detail=f"Invalid order_by column: {order_by_col!r}")

    where_clauses = []
    for category, values in grouped_filters.items():
        # Convert list to SQL tuple syntax: ('value1', 'value2')
        quoted_values = [f"'{v}'" for v in values]
        tuple_clause = f"({', '.join(quoted_values)})"
        where_clauses.append(f"{category} IN {tuple_clause}")

    where_sql = " AND ".join(where_clauses)

    # Build queries
    base_query = f"SELECT {columns_to_display_str} FROM {selected_dataset}"
    count_query = f"SELECT COUNT(*) AS count FROM {selected_dataset}"

    if where_sql:
        base_query += f" WHERE {where_sql}"
        count_query += f" WHERE {where_sql}"

    # Execute with parameters
    try:
        logger.info(f"selected_filters: {payload.selected_filters}")
        logger.info(f"count_query: {count_query}")

        total_hits = db_conn.execute(count_query).fetchone()[0]

        # Add pagination (LIMIT/OFFSET values can be parameterized in some databases)
        offset = (payload.page - 1) * payload.per_page
        if payload.order_by:
            base_query += f" ORDER BY {order_by_col} {payload.order_by.order}"
        base_query += f" LIMIT {payload.per_page} OFFSET {offset}"
        logger.info(f"base_query: {base_query}")

        res_df = db_conn.execute(base_query).fetchdf()
        res_df = res_df.replace({np.nan: None, np.inf: None, -np.inf: None})
        res_df = res_df.add_prefix(f"{selected_dataset}-")
        result = [serialize_amr_record(row, display_column_details) for _, row in res_df.iterrows()]

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

def flatten_record(record):
    """Convert list-of-dicts into {column_id: value}."""
    return {entry["column_id"]: entry.get("value") for entry in record}

def fetch_filtered_records(payload: Payload, scope: str = "all", file_format: str = "csv"):
    """
    Download filtered AMR records in CSV or JSON format.
    scope: "page" (current page) or "all" (all matches)
    """
    scope = (scope or "all").lower()
    if scope not in {"page", "all"}:
        raise HTTPException(status_code=400, detail="scope must be 'page' or 'all'")

    # Get data for current page or for all matches (simple: bump per_page)
    if scope == "all":
        payload_for_all = payload.model_copy(deep=True)
        payload_for_all.page = 1
        payload_for_all.per_page = 10_000_000  # large cap; adjust if you prefer
        data = filter_amr_records(payload_for_all)["data"]
    else:
        data = filter_amr_records(payload)["data"]

    if not data:
        raise HTTPException(status_code=404, detail="No data found for the given filters")

    flat_results = [flatten_record(r) for r in data]

    if file_format == "json":
        content = json.dumps(flat_results, ensure_ascii=False, indent=2)
        file_like = io.BytesIO(content.encode("utf-8"))
        filename = "amr_records.json"
        media_type = "application/json"
    else:  # default = csv
        # Collect headers from the first record
        logger.debug(f"flat_results: {flat_results[0]}")
        headers = list(flat_results[0].keys())
        buffer = io.StringIO()
        writer = csv.DictWriter(buffer, fieldnames=headers)
        writer.writeheader()
        writer.writerows(flat_results)
        file_like = io.BytesIO(buffer.getvalue().encode("utf-8"))
        filename = "amr_records.csv"
        media_type = "text/csv"

    return StreamingResponse(
        file_like,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
