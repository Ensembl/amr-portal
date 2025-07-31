from typing import List, Literal, Optional
from collections import defaultdict

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

import duckdb
import numpy as np

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
data = duckdb.read_parquet("step1_merge_all_v7.parquet")

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
        record = {
            "biosample_id": row.get("BioSample_ID"),
            "genus": row.get("genus"),
            "species": row.get("species"),
            "antibiotic_name": row.get("Antibiotic_name"),
            "antibiotic_abbreviation": row.get("Antibiotic_abbreviation"),
            "study_id": row.get("Study_ID"),
            "sra_sample": row.get("SRA_sample"),
            "sra_run": row.get("SRA_run"),
            "assembly": get_assembly(row.get("Assembly_ID")),
            "phenotype": row.get("phenotype"),
            "measurement": {
                "value": str(row.get("measurement_value")) if row.get("measurement_value") not in [None, "nan"] else None,
                "sign": row.get("measurement_sign"),
                "unit": row.get("measurement_unit"),
            },
            "isolation_context": row.get("isolation_context"),
            "isolation_source": row.get("isolation_source"),
            "platform": row.get("platform"),
            "laboratory_typing_platform": row.get("laboratory_typing_platform"),
            "laboratory_typing_method": row.get("laboratory_typing_method"),
            "isolation_latitude": None if row.get("isolation_latitude") == "nan" else row.get("isolation_latitude"),
            "isolation_longitude": None if row.get("isolation_longitude") == "nan" else row.get("isolation_longitude"),
            "collection_date": row.get("collection_date"),
        }
        result.append(record)

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
