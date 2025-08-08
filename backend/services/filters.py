from collections import defaultdict
import numpy as np
from fastapi import HTTPException

from backend.core.database import data
from backend.models.payload import Payload
from backend.services.serializer import serialize_amr_record
from backend.core.columns_schema import get_columns_list, get_sortable_columns

SCHEMA_COLUMNS = get_columns_list()
SORTABLE = get_sortable_columns()

def filter_amr_records(payload: Payload):
    # print(f"SCHEMA_COLUMNS -----> {SCHEMA_COLUMNS}")
    # TODO: We need to figure out how to handle ordering
    # print(f"SORTABLE -----> {SORTABLE}")
    grouped_filters = defaultdict(list)
    for f in payload.selected_filters:
        grouped_filters[f.category].append(f.value)

    where_clauses = []
    for category, values in grouped_filters.items():
        quoted = [f"'{v}'" for v in values]
        in_clause = f"{category} IN ({', '.join(quoted)})"
        where_clauses.append(in_clause)

    where_sql = " AND ".join(where_clauses)
    base_query = "SELECT * FROM amr_table"
    if where_sql:
        base_query += f" WHERE {where_sql}"

    count_query = f"SELECT COUNT(*) AS count FROM amr_table"
    if where_sql:
        count_query += f" WHERE {where_sql}"

    total_hits = data.query("amr_table", count_query).fetchone()[0]

    # Validate order column
    if payload.order_by:
        if payload.order_by.category not in SORTABLE:
            raise HTTPException(status_code=400, detail="Invalid column for ordering")
        base_query += f" ORDER BY {payload.order_by.category} {payload.order_by.order}"

    offset = (payload.page - 1) * payload.per_page
    base_query += f" LIMIT {payload.per_page} OFFSET {offset}"

    res_df = data.query("amr_table", base_query).fetchdf()
    res_df = res_df.replace({np.nan: None, np.inf: None, -np.inf: None})

    result = [serialize_amr_record(row) for _, row in res_df.iterrows()]

    response = {
        "meta": {
            "total_hits": total_hits,
            "page": payload.page,
            "per_page": payload.per_page,
            "columns": SCHEMA_COLUMNS
        },
        "data": result
    }

    return response