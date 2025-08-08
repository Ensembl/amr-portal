import numpy as np

def serialize_amr_record(row):
    def val(key):
        v = row.get(key)
        return None if v in [None, "nan", np.nan, np.inf, -np.inf] else v

    result = []
    keys = row.keys()

    # Handle measurement, only measurement_value is mandatory
    value = val("measurement_value") if "measurement_value" in keys else None
    if value is not None:
        sign = val("measurement_sign") if "measurement_sign" in keys else None
        unit = val("measurement_unit") if "measurement_unit" in keys else None
        parts = [str(part) for part in (sign, value, unit) if part is not None]
        measurement = " ".join(parts) if parts else None
    else:
        measurement = None

    result.append({
        "type": "string",
        "column_id": "measurement",
        "value": measurement
    })

    # Process remaining columns
    skip_measurement_fields = {"measurement_value", "measurement_unit", "measurement_sign"}

    for col in keys:
        if col in skip_measurement_fields:
            continue

        v = val(col)

        if col.lower() in {"assembly", "assembly_id"}:
            result.append({
                "type": "link",
                "column_id": "assembly",
                "value": v,
                "url": f"https://www.ebi.ac.uk/ena/browser/view/{v}" if v else None
            })
        elif col.lower().endswith("_date") or col.lower() == "collection_date":
            result.append({
                "type": "string",
                "column_id": col,
                "value": str(v) if v is not None else None
            })
        else:
            result.append({
                "type": "string",
                "column_id": col,
                "value": v
            })

    return result
