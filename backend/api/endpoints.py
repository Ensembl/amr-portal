from fastapi import APIRouter
from backend.models.payload import Payload
from backend.services.filters import filter_amr_records
from backend.core.filters_config import FILTERS_CONFIG

router = APIRouter()

@router.get("/filters-config")
def get_filters_config():
    return FILTERS_CONFIG

@router.post("/amr-records")
def get_amr_records(payload: Payload):
    return filter_amr_records(payload)
