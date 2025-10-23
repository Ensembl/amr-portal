import base64

import duckdb
from fastapi import APIRouter, Query, HTTPException, Depends

from backend.models.filters_config import FiltersConfig
from backend.models.release import Release
from backend.models.payload import Payload
from backend.services.filters import fetch_filters, filter_amr_records, fetch_filtered_records
from backend.services.release import fetch_release
from backend.core.database import get_db_connection

router = APIRouter()

@router.get("/filters-config", response_model=FiltersConfig)
def get_filters_config(db: duckdb.DuckDBPyConnection = Depends(get_db_connection)) -> FiltersConfig:
    filters: dict = fetch_filters(db)
    return FiltersConfig(**filters)

@router.post("/amr-records")
def get_amr_records(
    payload: Payload,
    db: duckdb.DuckDBPyConnection = Depends(get_db_connection)
):
    return filter_amr_records(payload, db)

@router.post("/amr-records/download")
def download_filtered_records(
    payload: Payload,
    scope: str = "all",
    file_format: str = "csv",
    db: duckdb.DuckDBPyConnection = Depends(get_db_connection)
):
    return fetch_filtered_records(payload, scope, file_format, db)


@router.get("/amr-records/download")
def download_filtered_records_get(
    payload: str = Query(default=..., description="URL-encoded JSON matching the Payload schema"),
    scope: str = Query(default="all", description="Either 'page' or 'all'"),
    file_format: str = Query(default="csv", description="Either 'csv' or 'json'"),
    db: duckdb.DuckDBPyConnection = Depends(get_db_connection)
):
    """
    GET version of /amr-records/download.
    Accepts `payload` as URL-encoded JSON (same shape as the POST body),
    plus `scope` and `file_format` as query params.
    """
    try:
        # validate directly from JSON string
        decoded_payload_bytes = base64.urlsafe_b64decode(payload)
        decoded_payload_string = decoded_payload_bytes.decode('utf-8')
        print('decoded_payload_string', decoded_payload_string)
        payload_obj = Payload.model_validate_json(decoded_payload_string)
        print(f"payload_obj: {payload_obj}")

    except Exception as e:
        # Provide a clear error message if payload is malformed
        raise HTTPException(status_code=400, detail=f"Invalid 'payload' JSON: {e}")

    return fetch_filtered_records(payload_obj, scope, file_format, db)


@router.get('/health')
def health():
    # Health checks for ensuring application is healthy
    # expand to include databae connectivity check etc
    return "Healthy: OK", 200


@router.get("/release", response_model=Release)
def get_release(db: duckdb.DuckDBPyConnection = Depends(get_db_connection)) -> Release:
    release: dict = fetch_release(db)
    return Release(**release)
