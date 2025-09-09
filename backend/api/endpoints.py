from fastapi import APIRouter
from backend.models.payload import Payload
from backend.services.filters import fetch_filters, filter_amr_records, fetch_filtered_records

router = APIRouter()

@router.get("/filters-config")
def get_filters_config():
    filters = fetch_filters()
    return filters

@router.post("/amr-records")
def get_amr_records(payload: Payload):
    return filter_amr_records(payload)

@router.post("/amr-records/download")
def download_filtered_records(payload: Payload, scope: str = "page", file_format: str = "csv"):
    return fetch_filtered_records(payload, scope, file_format)