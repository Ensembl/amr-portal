import os

import duckdb

DATASET_PREFIX = "dataset-"
SQL_CREATE_DATASET_COLUMNS = """
CREATE TABLE dataset_columns AS (
SELECT "table" AS "dataset", unnest(columns, recursive:=true)
FROM read_json([{}])
)
"""

FILTER_PREFIX = "filters-"
SQL_CREATE_FILTERS = """
CREATE TABLE filters AS (
SELECT id,dataset,label, unnest(filters, recursive:=true)
FROM read_json([{}])
)
"""

SQL_DATASETS = """
CREATE TABLE {} AS (
    SELECT * FROM '{}'
)
"""

SQL_CREATE_VIEW_TABLES = """
CREATE TABLE views (
    view_id INTEGER PRIMARY KEY,
    name VARCHAR,
    dataset VARCHAR
);

CREATE TABLE categories (
    category_id INTEGER PRIMARY KEY,
    name VARCHAR,
    is_primary BOOL
);

CREATE TABLE filter_to_categories (
    category_id INTEGER,
    filter_id VARCHAR
);

CREATE TABLE categories_to_views (
    view_id INTEGER,
    category_id INTEGER
)
"""

SQL_ADD_VIEW = """
INSERT INTO views (view_id, name, dataset) VALUES (?,?,?)
"""

SQL_ADD_CATEGORIES = """
INSERT INTO categories (category_id, name, is_primary) VALUES (?,?,?)
"""

SQL_LINK_VIEWS_AND_CATEGORIES = """
INSERT INTO categories_to_views (view_id, category_id) VALUES (?,?)
"""

SQL_LINK_FILTERS_AND_CATEGORIES = """
INSERT INTO filter_to_categories (category_id, filter_id) VALUES (?,?)
"""

SQL_CREATE_CATEGORIES_VIEW = """
CREATE VIEW view_categories as (
    SELECT views.view_id, categories.* FROM views
    JOIN categories_to_views ON views.view_id = categories_to_views.view_id
    JOIN categories ON categories.category_id = categories_to_views.category_id
)
"""

SQL_CREATE_FILTERS_VIEW = """
CREATE VIEW category_filters as (
    SELECT categories.category_id, filters.* FROM categories
    JOIN filter_to_categories ON
    filter_to_categories.category_id = categories.category_id
    JOIN filters on filters.id = filter_to_categories.filter_id
)
"""


def find_files(target_path: str, prefix: str, extension: str) -> [str]:
    return [
        os.path.join(target_path, f) for f in os.listdir(target_path)
        if f.startswith(prefix) and f.endswith(extension)
    ]


def find_parquets(target_path: str) -> [dict]:
    return [
        {
            "dataset": f.split('.')[0],
            "path": os.path.join(target_path, f)
        } for f in os.listdir(target_path)
        if f.endswith('.parquet')
    ]


def amr_release_to_duckdb(
        release_path: str,
        views: dict,
        release: str
        ) -> (bool, str):
    # create db
    db_path = os.path.join(release_path, "amr.duckdb")
    conn = duckdb.connect(db_path)

    # load dataset meta
    dataset_meta = [f"'{f}'" for f in find_files(
        release_path,
        DATASET_PREFIX,
        "json"
    )]

    if len(dataset_meta) == 0:
        return (False, "No dataset metadata found!")

    conn.execute(
        SQL_CREATE_DATASET_COLUMNS.format(
            ",".join(dataset_meta))
        )

    # load filters
    filters = [f"'{f}'" for f in find_files(
        release_path,
        FILTER_PREFIX,
        "json"
    )]

    conn.execute(
        SQL_CREATE_FILTERS.format(
            ",".join(filters))
        )

    # create view tables
    schema_sql = [
        SQL_CREATE_VIEW_TABLES,
        SQL_CREATE_CATEGORIES_VIEW,
        SQL_CREATE_FILTERS_VIEW
    ]

    for sql in schema_sql:
        conn.execute(sql)

    # setup views
    category_index = 1
    view_index = 1
    for v in views:
        conn.execute(
            SQL_ADD_VIEW,
            [view_index, v["name"], v["dataset"]]
        )

        groups = [
            (True, c) for c in v["categoryGroups"]
        ]
        groups.extend([
            (False, c) for c in v["otherCategoryGroups"]
        ])

        for (is_prime, cat) in groups:
            conn.execute(
                SQL_ADD_CATEGORIES,
                [category_index, cat["name"], is_prime]
            )

            conn.execute(
                SQL_LINK_VIEWS_AND_CATEGORIES,
                [view_index, category_index]
            )

            for c in cat["categories"]:
                conn.execute(
                    SQL_LINK_FILTERS_AND_CATEGORIES,
                    [category_index, c]
                )
            category_index += 1
        view_index += 1

    # load datasets
    datasets = find_parquets(
        release_path,
    )
    for d in datasets:
        print(
            SQL_DATASETS.format(
                d['dataset'],
                d['path']
            )
        )

        conn.execute(
            SQL_DATASETS.format(
                d['dataset'],
                d['path']
            )
        )
    return (True, "Success")
