import os

import duckdb

DATASET_PREFIX = "dataset-"
SQL_CREATE_DATASET_COLUMNS = """
CREATE TEMP TABLE column_dump AS (
SELECT "table" AS dataset, unnest(columns, recursive:=true)
FROM read_json([{}])
);

CREATE TEMP TABLE unique_datasets AS (
    SELECT DISTINCT dataset from column_dump
);

CREATE SEQUENCE sq_column_id START 1;
CREATE TABLE column_definition AS (
    SELECT nextval('sq_column_id') as column_id,
           concat(dataset,'-',id) as fullname,
           id as column_name,
           label,
           type,
           sortable,
           url
    FROM column_dump
);

CREATE SEQUENCE sq_dataset_id START 1;
CREATE TABLE dataset AS (
    SELECT nextval('sq_dataset_id') as dataset_id, dataset as name
    FROM unique_datasets
);

CREATE TABLE dataset_column AS (
    SELECT d.dataset_id, cd.column_id
    FROM dataset as d
    JOIN column_definition as cd
    ON cd.fullname.starts_with(d.name)
);
"""

SQL_DATASET_COLUMN_MAP = """
SELECT map_from_entries(LIST(cols)) as col_map
FROM (
    SELECT ROW(fullname, {'id':column_id, 'name':column_name}) as cols
    FROM column_definition
);
"""

FILTER_PREFIX = "filters-"
SQL_CREATE_FILTERS = """
CREATE TEMP TABLE filter_dump as (
    SELECT id, dataset,
           title, unnest(filters, recursive:=true)
    FROM read_json([{}]));

CREATE TABLE category AS (
    SELECT
        distinct cd.column_id,
        column_name,
        dataset,
        title
    FROM filter_dump as fd
    JOIN column_definition as cd
    ON (cd.fullname = CONCAT(fd.dataset,'-',fd.id))
);

CREATE TABLE filter AS (
    SELECT cd.column_id, value, fd.label
    FROM filter_dump as fd
    JOIN column_definition as cd
    ON (cd.fullname = CONCAT(fd.dataset,'-',fd.id))
);
"""

SQL_DATASETS = """
CREATE TABLE {} AS (
    SELECT * FROM '{}'
)
"""

SQL_GET_DATASET_COLUMNS = """
select column_name from (describe {});
"""

SQL_CREATE_VIEW_TABLES = """
CREATE TABLE view (
    view_id INTEGER PRIMARY KEY,
    name VARCHAR
);

CREATE TABLE view_column (
  view_id INTEGER,
  column_id BIGINT,
  rank INTEGER,
  enable_by_default BOOL
);

CREATE TABLE category_group (
    category_group_id INTEGER PRIMARY KEY,
    view_id INTEGER,
    name VARCHAR,
    is_primary BOOL
);

CREATE TABLE category_group_category (
    category_group_id INTEGER,
    column_id BIGINT
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

SQL_VIEW_COLUMN = """
INSERT INTO view_column (view_id, column_id, rank, enable_by_default)
VALUES (?,?,?,?)
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

    # load column data and build map
    conn.execute(
        SQL_CREATE_DATASET_COLUMNS.format(",".join(dataset_meta))
        )
    col_map = conn.query(SQL_DATASET_COLUMN_MAP).fetchone()[0]
    print(col_map)

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
        SQL_CREATE_VIEW_CATEGORIES_JSON
    ]

    for sql in schema_sql:
        conn.execute(sql)

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

    # setup views
    category_index = 1
    view_index = 1
    for v in views:
        conn.execute(
            SQL_ADD_VIEW,
            [view_index, v["name"]]
        )

        # filter groups
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
                column_id = col_map[f"{v['dataset']}-{c}"]['id']
                conn.execute(
                    SQL_LINK_CATEGORY_GROUP_AND_CATEGORY,
                    [category_index, column_id]  # COLUMN ID
                )
            category_index += 1
        # setup columns
        columns_added = []
        highest_rank = 0
        for c in v["columns"]:
            column_fullname = f"{v['dataset']}-{c['name']}"
            column_id = col_map[column_fullname]['id']
            conn.execute(
                SQL_VIEW_COLUMN,  # COLUMN ID
                [view_index, column_id, c['rank'], c['enabled']]
            )
            if c['rank'] > highest_rank:
                highest_rank = c['rank']
            columns_added.append(column_fullname)
        # pull in columns not detailed
        for dataset in v["other_columns"]:
            columns = conn.query(
                SQL_GET_DATASET_COLUMNS.format(dataset)
            ).fetchall()

            # loop through dataset, ommit
            for c in columns:
                column_fullname = f"{dataset}-{c[0]}"
                if column_fullname not in columns_added and column_fullname in col_map:
                    column_id = col_map[column_fullname]['id']
                    highest_rank += 1
                    conn.execute(
                        SQL_VIEW_COLUMN,   # COLUMN ID
                        [view_index, column_id, highest_rank, False]
                    )
        view_index += 1

    return (True, "Success")
