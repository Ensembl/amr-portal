# os.environ["DUCKDB_PATH"] = "/Users/ayates/amr-portal/scripts/etl/alpha_v3/amr_alpha_v3.duckdb"
duckdb_path = "https://ftp.ebi.ac.uk/pub/databases/amr_portal/releases/2025-11/tmp.portal.duckdb"
# duckdb_path = "/Users/ayates/amr-portal/scripts/etl/alpha_v3/amr_alpha_v3.duckdb"
import os
os.environ["DUCKDB_PATH"] = duckdb_path

import base64
from backend.models.payload import Payload
from backend.services.filters import _build_filter_query_context
from backend.core.database import get_db_connection


gen = get_db_connection()
db = next(gen)
try:
    # json_str = """
    # {"view_id":1,"selected_filters":[{"category":"phenotype-genus","value":"Acinetobacter"},{"category":"phenotype-genus","value":"Clostridioides"},{"category":"phenotype-genus","value":"Campylobacter"},{"category":"phenotype-genus","value":"Enterobacter"},{"category":"phenotype-genus","value":"Enterococcus"},{"category":"phenotype-genus","value":"Escherichia"},{"category":"phenotype-genus","value":"Haemophilus"},{"category":"phenotype-genus","value":"Helicobacter"},{"category":"phenotype-genus","value":"Salmonella"},{"category":"phenotype-genus","value":"Pseudomonas"},{"category":"phenotype-genus","value":"Providencia"},{"category":"phenotype-genus","value":"Proteus"},{"category":"phenotype-genus","value":"Neisseria"},{"category":"phenotype-genus","value":"Mycobacterium"},{"category":"phenotype-genus","value":"Morganella"},{"category":"phenotype-genus","value":"Klebsiella"},{"category":"phenotype-genus","value":"Serratia"},{"category":"phenotype-genus","value":"Shigella"},{"category":"phenotype-genus","value":"Staphylococcus"},{"category":"phenotype-genus","value":"Streptococcus"}]}
    # """
    json_str = """
    {
        "view_id":1,
        "selected_filters":[
            {"category":"phenotype-genus","value":"Acinetobacter"}
        ]
    }
    """
    # json_data = json.loads(json_str)
    payload = Payload.model_validate_json(json_str)
    payload.selected_columns = ["BioSample_ID"]
    payload.distinct = True
    context = _build_filter_query_context(payload, db)
    print("======")
    print(context.base_query)
    print("======")
    query = f"""
    COPY (
        {context.base_query}
    ) TO 'output.csv' (HEADER, DELIMITER ',')
    """
    db.execute(query)
finally:
    try:
        next(gen)  # triggers the cleanup (conn.close)
    except StopIteration:
        pass