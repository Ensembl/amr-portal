from __future__ import annotations

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


def _build_filter_views(rows: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
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
    filter_views = _build_filter_views(view_rows)

    return {
        "filterCategories": filter_categories,
        "filterViews": filter_views,
    }
