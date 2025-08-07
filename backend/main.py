from typing import List, Literal, Optional
from collections import defaultdict

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

import duckdb
import numpy as np
import yaml

from pydantic import BaseModel
from filters_config import FILTERS_CONFIG

app = FastAPI()

# Add CORS support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000, compresslevel=5)

# Connecting to the DuckDB database
data = duckdb.read_parquet("amr_v2.parquet")

class SelectedFilter(BaseModel):
    # the column name
    category: str
    # the value to filter by
    value: str

class OrderBy(BaseModel):
    category: str
    order: Literal["ASC", "DESC"]

class Payload(BaseModel):
    selected_filters: List[SelectedFilter]
    page: Optional[int] = 1
    per_page: Optional[int] = 100
    order_by: Optional[OrderBy] = None


@app.get("/openapi.yaml", include_in_schema=False)
async def get_openapi_yaml():
    openapi_json = app.openapi()
    yaml_s = yaml.dump(openapi_json, sort_keys=False)
    return Response(yaml_s, media_type="text/yaml")

@app.get("/filters-config")
def get_filters_confi():
    return FILTERS_CONFIG

@app.post("/amr-records")
def get_amr_records(payload: Payload):
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

    # Count query
    count_query = f"SELECT COUNT(*) AS count FROM amr_table"
    if where_sql:
        count_query += f" WHERE {where_sql}"

    total_hits = data.query("amr_table", count_query).fetchone()[0]

    # ORDER BY validation
    ALLOWED_ORDER_COLUMNS = set(data.columns)
    if payload.order_by and payload.order_by.category not in ALLOWED_ORDER_COLUMNS:
        raise HTTPException(status_code=400, detail="Invalid column for ordering")

    # Pagination
    offset = (payload.page - 1) * payload.per_page
    paginated_query = base_query
    if payload.order_by:
        paginated_query += f" ORDER BY {payload.order_by.category} {payload.order_by.order}"
    paginated_query += f" LIMIT {payload.per_page} OFFSET {offset}"

    # Final query execution
    print(f"paginated_query ---> {paginated_query}")
    res_df = data.query("amr_table", paginated_query).fetchdf()
    res_df = res_df.replace({np.nan: None, np.inf: None, -np.inf: None})

    result = []
    for _, row in res_df.iterrows():
        result.append(serialize_amr_record(row))

    return {
        "meta": {
            "total_hits": total_hits,
            "page": payload.page,
            "per_page": payload.per_page,
        },
        "data": result
    }


def get_assembly(assembly_accession_id: str | None):
    if (assembly_accession_id):
        return {
            "accession_id": assembly_accession_id,
            "url": f"https://www.ebi.ac.uk/ena/browser/view/{assembly_accession_id}"
        }


def serialize_amr_record(row):
    def val(key):
        v = row.get(key)
        return None if v in [None, "nan", np.nan, np.inf, -np.inf] else v

    result = []

    keys = row.keys()

    # Special handling: measurement
    has_measurement = "measurement_value" in keys and "measurement_unit" in keys
    if has_measurement:
        value = val("measurement_value")
        unit = val("measurement_unit")
        if value is not None and unit is not None:
            result.append({
                "type": "string",
                "column_id": "measurement",
                "value": f"{value} {unit}"
            })

    for col in keys:
        v = val(col)

        # skip the measurement components already used
        if has_measurement and col in {"measurement_value", "measurement_unit", "measurement_sign"}:
            continue

        # handle assembly links
        elif col.lower() in {"assembly", "assembly_id"}:
            result.append({
                "type": "link",
                "column_id": "assembly",
                "value": v,
                "url": f"https://www.ebi.ac.uk/ena/browser/view/{v}" if v else None
            })

        # handle dates
        elif col.lower().endswith("_date") or col.lower() == "collection_date":
            result.append({
                "type": "string",
                "column_id": col,
                "value": str(v) if v is not None else None
            })

        else:
            result.append({
                "type": "string",
                "column_id": col,
                "value": v
            })

    return result
