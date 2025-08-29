import os

import duckdb

DATASET_PREFIX = "dataset-"
SQL_CREATE_DATASET_COLUMNS = """
CREATE TEMP TABLE dataset_columns_dump AS (
SELECT "table" AS dataset, unnest(columns, recursive:=true)
FROM read_json([{}])
);
CREATE TABLE dataset_column AS (
    SELECT concat(dataset,'-',id) as column_id,
           id as column_name,
           label,
           type,
           sortable,
           url
    FROM dataset_columns_dump
);
"""

FILTER_PREFIX = "filters-"
SQL_CREATE_FILTERS = """
CREATE TEMP TABLE filter_dump as (
    SELECT id,dataset,title, unnest(filters, recursive:=true)
    FROM read_json([{}]));

CREATE TABLE category AS (
    SELECT
        distinct concat(dataset,'-',id) as column_id,
        id as column_name,
        dataset,
        title
    FROM filter_dump
);

CREATE TABLE filter AS (
    SELECT concat(dataset,'-',id) as column_id, value, label
    FROM filter_dump
);
"""

SQL_DATASETS = """
CREATE TABLE {} AS (
    SELECT * FROM '{}'
)
"""

SQL_CREATE_VIEW_TABLES = """
CREATE TABLE view (
    view_id INTEGER PRIMARY KEY,
    name VARCHAR
);

CREATE TABLE category_group (
    category_group_id INTEGER PRIMARY KEY,
    view_id INTEGER,
    name VARCHAR,
    is_primary BOOL
);

CREATE TABLE category_group_category (
    category_group_id INTEGER,
    column_id VARCHAR
);
"""

SQL_ADD_VIEW = """
INSERT INTO view (view_id, name) VALUES (?,?)
"""

SQL_ADD_CATEGORY_GROUPS = """
INSERT INTO category_group (category_group_id, view_id, name, is_primary)
VALUES (?,?,?,?)
"""

SQL_LINK_CATEGORY_GROUP_AND_CATEGORY = """
INSERT INTO category_group_category (category_group_id, column_id)
VALUES (?,?)
"""

SQL_CREATE_CATEGORIES_VIEW = """
CREATE VIEW view_categories as (
    SELECT views.view_id, categories.* FROM views
    JOIN categories_to_views ON views.view_id = categories_to_views.view_id
    JOIN categories ON categories.column_id = categories_to_views.column_id
)
"""

SQL_CREATE_VIEW_CATEGORIES = """
CREATE VIEW view_categories as (
        SELECT
          v.view_id,
          cg.category_group_id,
          v.name AS view_name,
          cg.name AS category_group_name,
          cg.is_primary as category_group_is_primary,
          c.title as category_name,
          c.column_id,
          c.column_name
        FROM view AS v
        JOIN category_group AS cg ON v.view_id = cg.view_id
        JOIN category_group_category AS cgc
        ON cgc.category_group_id = cg.category_group_id
        JOIN category AS c ON c.column_id = cgc.column_id
        ORDER BY v.view_id, c.column_id
)
"""

SQL_CREATE_VIEW_CATEGORIES_JSON = """
CREATE VIEW view_categories_json as (
    SELECT
    {view_id: v.view_id,
    category_group_id: cg.category_group_id,
    view_name: v.name,
    category_group_name: cg.name,
    category_group_is_primary: cg.is_primary,
    category_name: c.title,
    column_id: c.column_id,
    column_name: c.column_name}::JSON as json
    FROM view AS v
    JOIN category_group AS cg ON v.view_id = cg.view_id
    JOIN category_group_category AS cgc
    ON cgc.category_group_id = cg.category_group_id
    JOIN category AS c ON c.column_id = cgc.column_id
    ORDER BY v.view_id, c.column_id
);
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
    db_path = os.path.join(release_path, f"amr_{release}.duckdb")
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
        SQL_CREATE_DATASET_COLUMNS.format(",".join(dataset_meta))
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
        SQL_CREATE_VIEW_CATEGORIES,
        SQL_CREATE_VIEW_CATEGORIES_JSON,
        # SQL_CREATE_CATEGORIES_VIEW,
        # SQL_CREATE_FILTERS_VIEW
    ]

    for sql in schema_sql:
        conn.execute(sql)

    # setup views
    category_index = 1
    view_index = 1
    for v in views:
        conn.execute(
            SQL_ADD_VIEW,
            [view_index, v["name"]]
        )

        groups = [
            (True, c) for c in v["categoryGroups"]
        ]
        groups.extend([
            (False, c) for c in v["otherCategoryGroups"]
        ])

        for (is_prime, cat) in groups:
            conn.execute(
                SQL_ADD_CATEGORY_GROUPS,
                [category_index, view_index, cat['name'], is_prime]
            )

            for c in cat["categories"]:
                conn.execute(
                    SQL_LINK_CATEGORY_GROUP_AND_CATEGORY,
                    [category_index, f"{v['dataset']}-{c}"]
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
