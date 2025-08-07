import numpy as np

def serialize_amr_record(row):
    def val(key):
        v = row.get(key)
        return None if v in [None, "nan", np.nan, np.inf, -np.inf] else v

    result = []
    keys = row.keys()

    has_measurement = "measurement_value" in keys and "measurement_unit" in keys
    if has_measurement:
        value = val("measurement_value")
        unit = val("measurement_unit")
        if value is not None and unit is not None:
            result.append({
                "type": "string",
                "column_id": "measurement",
                "value": f"{value} {unit}"
            })

    for col in keys:
        v = val(col)
        if has_measurement and col in {"measurement_value", "measurement_unit", "measurement_sign"}:
            continue
        elif col.lower() in {"assembly", "assembly_id"}:
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
