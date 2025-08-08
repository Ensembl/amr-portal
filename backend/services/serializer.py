import numpy as np
from backend.core.columns_schema import get_columns_list, get_column_meta_map

COLUMN_META_MAP = get_column_meta_map()
ORDERED_COLUMNS = [c["id"] for c in get_columns_list()]

def _clean(v):
    return None if v in (None, "nan", np.nan, np.inf, -np.inf) else v

def serialize_amr_record(row):
    result = []

    keys = list(row.keys())

    # Synthetic "measurement" (kept for convenience/UI)
    # Handle measurement, only measurement_value is mandatory
    value = _clean(row.get("measurement_value"))
    if value is not None:
        sign = _clean(row.get("measurement_sign"))
        unit = _clean(row.get("measurement_unit"))
        parts = [str(part) for part in (sign, value, unit) if part is not None]
        measurement = " ".join(parts) if parts else None
    else:
        measurement = None

    # Skip raw measurement parts from the rest
    skip = {"measurement_value", "measurement_unit", "measurement_sign"}

    # Prefer schema order, then any extra columns that appear in data
    # TODO: this is where we can play with the ordering.. to demystify
    ordered = [c for c in ORDERED_COLUMNS if c in keys and c not in skip]
    extras  = [c for c in keys if c not in set(ordered) | skip]

    for col in ordered + extras:
        v = _clean(row.get(col))
        meta = COLUMN_META_MAP.get(col, {"type": "string", "sortable": False})

        if meta.get("type") == "link":
            url_t = meta.get("url")
            result.append({
                "type": "link",
                "column_id": col,
                "value": v,
                "url": (url_t.format(v) if (v and url_t) else None),
            })
        else:
            # Default: string
            result.append({
                "type": "string",
                "column_id": col,
                "value": (str(v) if v is not None else None) if col.endswith("_date") or col == "collection_date" else v
            })

    # add measurement last
    # TODO: this is a synthetic column, we need to agree on how to handle it
    """
    If we want the client to know about the synthetic column too, we need to add it to the column_schema JSON:
    ```
    {
      "id": "measurement",
      "label": "Measurement",
      "type": "string",
      "sortable": false
    }
    ```
    """
    result.append({
        "type": "string",
        "column_id": "measurement",
        "value": measurement
    })

    return result
