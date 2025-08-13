"""
Helper methods used to transform dataset inputs into parquet files
"""
import os

import duckdb

"""
# Step 1: Connect to new .duckdb file
conn = duckdb.connect("../amr_data.duckdb")

# Step 2: Create table from Parquet
conn.execute("CREATE TABLE amr_table AS SELECT * FROM '../amr_v2.parquet'")

# Optional: verify the schema
print(conn.execute("PRAGMA table_info('amr_table')").fetchall())

conn.close()
"""

DATASET_VIEW = """
create view dataset as
select * from
read_csv('{}', header=true, all_varchar=true, delim =',', quote='"');
"""

FILTER_VIEW = """
create view filter as
select * from read_csv('{}',header=false, columns = {{ '{}': 'VARCHAR'}});
"""

FILTERED_DATASET_VIEW = """
create view filtered_dataset as
select dataset.* from dataset right join filter on dataset.{} = filter.{}
"""

OUTPUT = """
COPY {} TO '{}'
"""


def transform_dataset(data: dict, release_path: str) -> (bool, str):
    # load data set
    print(data)
    target = "dataset"
    conn = duckdb.connect()
    conn.execute(DATASET_VIEW.format(data['path']))
    # filter
    if "filter" and "filter_column" in data:
        target = "filtered_dataset"
        col = data["filter_column"]
        conn.execute(FILTER_VIEW.format(data['filter'], col))
        
        print(FILTERED_DATASET_VIEW.format(col, col))
        conn.execute(FILTERED_DATASET_VIEW.format(col, col))

    # join columns

    # output as parquet
    name = f"{data['name']}.parquet"
    save_path = os.path.join(release_path, name)
    conn.execute(OUTPUT.format(target, save_path))
    conn.close()

    return (True, save_path)


def transform_datasets(datasets: list[dict], release_path: str) -> (bool, str, list[str]):
    paths = []
    for dataset in datasets:
        result = transform_dataset(
            dataset,
            release_path
        )

        if not result[0]:
            return (result[0], result[1], [])
        else:
            paths.append(result[1])
    return (True, "Success", paths)
