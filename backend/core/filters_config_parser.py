from __future__ import annotations

from pprint import pprint
from typing import Dict, List, Any, Iterable, Tuple, DefaultDict
from collections import defaultdict, OrderedDict

from backend.core.database import db_conn as default_db_conn


def _query_to_records(db, sql: str) -> List[Dict[str, Any]]:
    """Run a SQL query and return a list of dict records.

    Args:
        db: Database connection object exposing `.query(sql).fetchdf()`.
        sql: SQL query to execute.

    Returns:
        List[Dict[str, Any]]: Each row represented as a dictionary.
    """
    return db.query(sql).fetchdf().to_dict(orient="records")


def _build_filter_categories(rows: Iterable[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """Transform raw `filter` table rows into the `filterCategories` structure.

    Args:
        rows: Iterable of dict rows from the `filters` table.

    Returns:
        Dict[str, Dict[str, Any]]: Mapping of category-id -> category payload with its filters.
    """
    categories: Dict[str, Dict[str, Any]] = OrderedDict()

    for r in rows:
        cat_id = r["column_id"]
        if cat_id not in categories:
            categories[cat_id] = {
                "id": r["column_id"],
                "label": r["label"],
                "dataset": r["dataset"],
                "filters": [],
            }
        categories[cat_id]["filters"].append(
            {
                "label": r["label"],
                "value": r["value"],
            }
        )

    return categories


def _ensure_group(
    view: Dict[str, Any],
    group_name: str,
    is_primary: bool,
    group_index: Dict[Tuple[str, bool], int],
) -> Dict[str, Any]:
    """Ensure a category group exists on a view and return it.

    Args:
        view: The view dict with 'categoryGroups' and 'otherCategoryGroups'.
        group_name: Name of the category group.
        is_primary: Whether the group belongs to 'categoryGroups' (True) or 'otherCategoryGroups' (False).
        group_index: Internal index mapping (group_name, is_primary) -> index in the target list.

    Returns:
        Dict[str, Any]: The category group dictionary (with a 'categories' list).
    """
    key = (group_name, is_primary)
    target_key = "categoryGroups" if is_primary else "otherCategoryGroups"

    if key in group_index:
        return view[target_key][group_index[key]]

    group = {"name": group_name, "categories": []}
    view[target_key].append(group)
    group_index[key] = len(view[target_key]) - 1
    return group


def _build_columns_per_view(db):
    """Builds a dictionary mapping view names to their column configurations.

    Queries the database to retrieve column configurations for all views, including
    column metadata such as labels, sortability, ranking, and default visibility.
    The results are grouped by view name for easy access.

    Args:
        db: Database connection object used to execute the query.

    Returns:
        A dictionary where keys are view names and values are lists of column
        configuration dictionaries. Each column dictionary contains:
            - view_name: The view name teh column belongs to
            - id: The column identifier
            - label: The display label for the column
            - sortable: Boolean indicating if the column is sortable
            - rank: The display order/ranking of the column
            - enable_by_default: Boolean indicating if column is enabled by default (for visibility)

    Example:
        >>> result = _build_columns_per_view(db)
        >>> result['AMR antibiotics']
        [{'view_name': 'AMR antibiotics', 'id': 'phenotype-Antibiotic_name, 'label': 'Antibiotic Name', 'sortable': True, 'rank': 1, 'enable_by_default': True},
         {'view_name': 'AMR antibiotics', 'id': 'phenotype-Antibiotic_abbreviation', 'label': ''Antibiotic Abbreviation', 'sortable': True, 'rank': 2, 'enable_by_default': True}]
    """
    columns_per_view_query = """
     SELECT v.name as view_name, vc.column_id AS id, label, sortable, rank, enable_by_default
     FROM view_column as vc
              JOIN dataset_column dc on vc.column_id = dc.column_id
              JOIN view v on vc.view_id = v.view_id
     ORDER BY rank
     """

    columns_per_view = _query_to_records(db, columns_per_view_query)
    columns_grouped_per_view = defaultdict(list)

    for col in columns_per_view:
        columns_grouped_per_view[col["view_name"]].append(col)

    return columns_grouped_per_view


def _build_filter_views(db, rows: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Transform joined rows into the `filterViews` structure.

    Args:
        rows: Iterable of dict rows from the views/categories/filters join.

    Returns:
        List[Dict[str, Any]]: List of view dictionaries ordered by view_id asc.
    """
    # Build views keyed by view_id to avoid assuming contiguous IDs.
    views: Dict[Any, Dict[str, Any]] = OrderedDict()
    # Per-view index of groups to avoid O(n^2) lookups when appending.
    per_view_group_index: Dict[Any, Dict[Tuple[str, bool], int]] = defaultdict(dict)

    for r in rows:
        vid = r["view_id"]
        if vid not in views:
            views[vid] = {
                "name": r["view_name"],
                "categoryGroups": [],
                "otherCategoryGroups": [],
            }

        view = views[vid]
        group = _ensure_group(
            view=view,
            group_name=r["category_name"],
            is_primary=bool(r["category_group_is_primary"]),
            group_index=per_view_group_index[vid],
        )

        # Append the filter id (avoid accidental duplicates)
        if r["column_id"] not in group["categories"]:
            group["categories"].append(r["column_id"])

    # Add columns per view
    columns_per_view = _build_columns_per_view(db)
    for view_id, view in views.items():
        view_name = view["name"]
        if view_name in columns_per_view:
            # Get columns and remove 'view_name' from each column dict
            columns = columns_per_view[view_name]
            for column in columns:
                column.pop("view_name", None)  # Remove view_name if it exists
            view["columns"] = columns
        else:
            # Handle case where view name doesn't exist
            view["columns"] = []

    # Return views ordered by view_id (insertion order already reflects scan order,
    # but sorting is safer if the SQL loses ORDER BY in the future).
    return [views[k] for k in sorted(views.keys())]


def build_filters_config(db=default_db_conn) -> Dict[str, Any]:
    """Build the complete filters configuration document.

    This wraps two steps:
      1) Build `filterCategories` from the `filter` and `category` tables.
      2) Build `filterViews` from `view_categories` DuckDB view.

    Args:
        db: Database connection object. Defaults to the shared `db_conn`.

    Returns:
        Dict[str, Any]: A dictionary with keys:
            - "filterCategories": {category_id: {...}}
            - "filterViews": [ {...}, ... ]
    """
    # Categories
    filters_category_query = """
        SELECT  f.label, f.value, c.dataset, c.column_id
        FROM filter f
        JOIN category AS c ON c.column_id = f.column_id
    """
    category_rows = _query_to_records(db, filters_category_query)
    filter_categories = _build_filter_categories(category_rows)

    # Views
    filters_view_query = """
        SELECT view_id,
            category_group_id,
            view_name,
            category_name,
            column_id,
            category_group_is_primary
        FROM view_categories
        ORDER BY view_id, category_group_id
    """
    view_rows = _query_to_records(db, filters_view_query)
    filter_views = _build_filter_views(db, view_rows)

    return {
        "filterCategories": filter_categories,
        "filterViews": filter_views,
    }
