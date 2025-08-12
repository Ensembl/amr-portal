import json

import duckdb


def generate_filters(
    config_path: str,
    data_path: str,
    output_path: str,
    schema_path: str
):
    print("Generating filters")
    # load json
    with open(config_path) as json_in:
        filters = json.load(json_in)

    # Todo Json schema validation
    # Validate filter json
    with open(schema_path) as schema_in:
        schema = json.load(schema_in)
    if not validate_filters(filters, schema, True):
        print("Unable to generate filters due to the above reasons!!")
        return

    # connect to database
    conn = duckdb.connect()
    duckdb.read_parquet(data_path)
    conn.sql(f"CREATE VIEW amr_data AS SELECT * FROM '{data_path}'")

    filter_sql = """
    SELECT DISTINCT {} as value, {} as label
    FROM amr_data
    WHERE {} is not null
    ORDER BY label ASC"""

    # generate filter values
    for id, f in filters["filterCategories"].items():
        sql = filter_sql.format(
            f["id"],
            f["filter_label"],
            f["id"]
            )
        results = conn.sql(sql)
        cols = results.columns
        filter_values = results.fetchall()

        f["filters"] = [
            {cols[0]: str(r[0]), cols[1]: str(r[1])} for r in filter_values
            ]
        if len(f["filters"]) == 0:
            print(f"Warning! {f['id']} has no values")

        if len(f["filters"]) > 60:
            print(f"Warning! {f['id']} has over 60 ({len(f['filters'])}) values")
        del f["filter_label"]

    # save
    with open(output_path, "w") as results_out:
        json.dump(filters, results_out, indent=2)
    print("Done!")