from typing import Dict, List
from pydantic import BaseModel, Field, ConfigDict


class FilterOption(BaseModel):
    label: str
    value: str


class FilterCategory(BaseModel):
    # e.g. "genotype-genome", "phenotype-Antibiotic_abbreviation"
    id: str
    label: str
    # e.g. "genotype" | "phenotype"
    dataset: str
    filters: List[FilterOption]


class Column(BaseModel):
    # e.g. "phenotype-Antibiotic_name"
    id: str
    label: str
    sortable: bool
    rank: int
    enable_by_default: bool = Field(alias="enable_by_default")


class CategoryGroup(BaseModel):
    name: str
    # list of category ids (column_id strings), e.g. ["phenotype-Antibiotic_abbreviation"]
    categories: List[str]


class FilterView(BaseModel):
    name: str
    categoryGroups: List[CategoryGroup]
    otherCategoryGroups: List[CategoryGroup]
    columns: List[Column]


class FiltersConfig(BaseModel):
    model_config = ConfigDict(validate_by_name=True, validate_by_alias=True)

    filterCategories: Dict[str, FilterCategory] = Field(alias="filterCategories")
    filterViews: List[FilterView] = Field(alias="filterViews")