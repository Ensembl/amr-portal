from fastapi import APIRouter

from backend.models.filters_config import FiltersConfig
from backend.models.payload import Payload
from backend.services.filters import fetch_filters, filter_amr_records, fetch_filtered_records

router = APIRouter()

@router.get("/filters-config", response_model=FiltersConfig)
def get_filters_config() -> FiltersConfig:
    filters: dict = fetch_filters()
    return FiltersConfig(**filters)

@router.post("/amr-records")
def get_amr_records(payload: Payload):
    return filter_amr_records(payload)

@router.post("/amr-records/download")
def download_filtered_records(payload: Payload, scope: str = "all", file_format: str = "csv"):
    return fetch_filtered_records(payload, scope, file_format)

@router.get('/health')
def health():
    # Health checks for ensuring application is healthy
    # expand to include databae connectivity check etc
    return "Healthy: OK", 200

