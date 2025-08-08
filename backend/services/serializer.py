import numpy as np
from backend.core.columns_schema import get_columns_list, get_column_meta_map

# keeps JSON order
SCHEMA_COLUMNS = get_columns_list()
# id -> meta (type, url, sortable, ...)
COLUMN_META_MAP = get_column_meta_map()

MEASUREMENT_FIELDS = {"measurement_value", "measurement_unit", "measurement_sign"}


def _clean(v):
    return None if v in (None, "nan", np.nan, np.inf, -np.inf) else v


def _is_date_col(col: str) -> bool:
    c = col.lower()
    return c.endswith("_date") or c == "collection_date"


def serialize_amr_record(row):
    result = []

    # Build the synthetic measurement
    # Only measurement_value is mandatory
    value = _clean(row.get("measurement_value"))
    if value is not None:
        sign = _clean(row.get("measurement_sign"))
        unit = _clean(row.get("measurement_unit"))
        parts = [str(part) for part in (sign, value, unit) if part is not None]
        measurement = " ".join(parts) if parts else None
    else:
        measurement = None

    # Iterate strictly in the schema order
    # columns not in the schema are not included
    for col_meta in SCHEMA_COLUMNS:
        col = col_meta["id"]

        # Skip raw measurement components
        if col in MEASUREMENT_FIELDS:
            continue

        # Inline-handle the synthetic measurement column
        if col == "measurement":
            result.append({
                "type": "string",  # keep synthetic as string
                "column_id": "measurement",
                "value": measurement
            })
            continue

        v = _clean(row.get(col))

        if col_meta.get("type") == "link":
            url_tmpl = col_meta.get("url")
            result.append({
                "type": "link",
                "column_id": col,
                "value": v,
                "url": (url_tmpl.format(v) if (v and url_tmpl) else None),
            })
        else:
            result.append({
                "type": "string",
                "column_id": col,
                "value": (str(v) if (v is not None and _is_date_col(col)) else v),
            })

    for col_dict in result:
        if col_dict.get("column_id") == "measurement" and measurement is not None:
            col_dict["value"] = measurement

    return result
