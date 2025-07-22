from typing import Union

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import duckdb
import numpy as np

from filters_config import FILTERS_CONFIG

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connecting to the DuckDB database
data = duckdb.read_parquet("step1_merge_all_v7.parquet")

@app.get("/filters-config")
def get_filters_confi():
    return FILTERS_CONFIG

@app.get("/amr-records")
def get_amr_records():
    res_df = data.query("amr_table", "SELECT * FROM amr_table LIMIT 10").fetchdf()
    # replace all NaN, inf, and -inf with None, which FastAPI will serialize as null
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
            "assembly_accession_id": row.get("Assembly_ID"),
            "phenotype": row.get("phenotype"),
            "measurement": {
                "value": str(row.get("measurement_value")) if row.get("measurement_value") not in [None,
                                                                                                   "nan"] else None,
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

    return result

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}