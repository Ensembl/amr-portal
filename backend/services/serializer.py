import numpy as np

KNOWN_ATTRIBUTES = ["type","sortable", "url", "delimiter"]

def serialize_amr_record(row, column_details:dict):
    def val(key):
        v = row.get(key)
        return None if v in [None, "nan", np.nan, np.inf, -np.inf] else v

    result = []
    keys = row.keys()

    for col in keys:
        v = val(col)
        
        if col in column_details:
            # Add column detail attributes to cell
            cd = column_details[col]
            cell_obj = {
                cd_k:cd_v for cd_k, cd_v in cd.items() 
                if cd_k in KNOWN_ATTRIBUTES and cd_v is not None
            }
            
            # inject value for url 
            if "url" in cell_obj:
                cell_obj["url"] = cell_obj["url"].format(v)
            # Add missing attribute
            cell_obj["column_id"] = col
            cell_obj["value"] = v
            result.append(cell_obj)
        else:
            result.append({
                "type": "string",
                "column_id": col,
                "value": v
            })
        
    return result
