from fastapi import APIRouter
from backend.models.payload import Payload
from backend.services.filters import fetch_filters, filter_amr_records

router = APIRouter()

@router.get("/filters-config")
def get_filters_config():
    filters = fetch_filters()
    return filters

@router.post("/amr-records")
def get_amr_records(payload: Payload):
    return filter_amr_records(payload)
