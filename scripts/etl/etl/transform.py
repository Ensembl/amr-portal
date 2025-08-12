"""
Helper methods used to transform dataset inputs into parquet files
"""
import duckdb


# Step 1: Connect to new .duckdb file
conn = duckdb.connect("../amr_data.duckdb")

# Step 2: Create table from Parquet
conn.execute("CREATE TABLE amr_table AS SELECT * FROM '../amr_v2.parquet'")

# Optional: verify the schema
print(conn.execute("PRAGMA table_info('amr_table')").fetchall())

conn.close()


def transform_genotype(path: str, release_path: str) -> (bool, str):
    return (False, "WIP")


def transform_phenotype(path: str, release_path: str) -> (bool, str):
    return (False, "WIP")


def transform_dataset(path: str, release_path: str) -> (bool, str):
    return (False, "WIP")


KNOWN_DATASETS = {
    "genotype": transform_genotype,
    "phenotype": transform_phenotype
}

def transform_datasets(datasets: list[dict], release_path: str) -> (bool, str, list[dict]):
    for dataset in datasets:
        if dataset["name"] in KNOWN_DATASETS:
            result = KNOWN_DATASETS[dataset["name"]](
                dataset["path"],
                release_path
            )
        else:
            result = transform_dataset(
                dataset["path"],
                release_path
            )

        if not result[0]:
            return (result[0], result[1], [])