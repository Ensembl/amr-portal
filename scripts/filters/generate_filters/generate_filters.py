import sys
import argparse
import json

import duckdb

DESCRIPTION = "Tool for generating AMR filter data"


def get_cli_args() -> argparse.ArgumentParser:
    """
    CLI arguments object
    """
    cli = argparse.ArgumentParser(
        prog=sys.argv[0],
        description=DESCRIPTION
    )

    cli.add_argument(
        '-c',
        '--config',
        help="A JSON file that defines the filter categories and views"
    )

    cli.add_argument(
        '-d',
        '--data',
        help="parquet file containing AMR data",
    )

    cli.add_argument(
        '-o',
        '--output',
        default="filters.json",
        help="File name for output. Defaults to filters.json",
    )
    return cli


def generate_filters(config_path, data_path, output_path):
    print("Generating filters")
    # load json
    with open(config_path) as json_in:
        filters = json.load(json_in)

    # connect to database
    conn = duckdb.connect()
    duckdb.read_parquet(data_path)
    conn.sql(f"CREATE VIEW amr_data AS SELECT * FROM '{data_path}'")

    filter_sql = "SELECT DISTINCT {} as value, {} as label from amr_data where {} is not null"

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


if __name__ == "__main__":
    cli = get_cli_args().parse_args(sys.argv[1:])
    generate_filters(cli.config, cli.data, cli.output)
