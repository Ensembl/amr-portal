from typing import List, Literal, Optional
from pydantic import BaseModel

class SelectedFilter(BaseModel):
    category: str
    value: str

class OrderBy(BaseModel):
    category: str
    order: Literal["ASC", "DESC"]

class Payload(BaseModel):
    selected_filters: List[SelectedFilter]
    dataset: str = "phenotype"  # TODO: remove later
    page: Optional[int] = 1
    per_page: Optional[int] = 100
    order_by: Optional[OrderBy] = None
