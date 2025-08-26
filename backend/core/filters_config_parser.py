from backend.core.database import db_conn

FILTER_CATEGORIES = {}
FILTER_VIEWS = []

FILTERS_SKELETON = {
    "filterCategories": FILTER_CATEGORIES,
    "filterViews": FILTER_VIEWS,
}

def build_filters_config():

    # build filter categories
    filters_category_query = """SELECT * FROM filters"""
    filters_category_result = db_conn.query(filters_category_query).fetchdf()
    filters_category_result_array = filters_category_result.to_dict(orient="records")

    for filter_category_row in filters_category_result_array:
        id = filter_category_row["id"]
        if id not in FILTER_CATEGORIES:
            FILTER_CATEGORIES[id] = {
                "id": filter_category_row["id"],
                "label": filter_category_row["title"],
                "dataset": filter_category_row["dataset"],
                "filters": []
            }

        # populate the filters
        FILTER_CATEGORIES[id]["filters"].append({
            # "category_id": filter_category_row["category_id"],
            "label": filter_category_row["label"],
            "value": filter_category_row["value"],
        })

    # build filter views
    filters_view_query = """
        SELECT v.view_id, c.category_id, 
          v.name as view_name,
          c.name as category_name, 
          ftg.filter_id,
          c.is_primary
        FROM views as v
        JOIN categories_to_views ctv on v.view_id = ctv.view_id
        JOIN categories c on ctv.category_id = c.category_id
        JOIN filter_to_categories ftg on c.category_id = ftg.category_id
        ORDER BY v.view_id, c.category_id
    """
    filters_view_result = db_conn.query(filters_view_query).fetchdf()
    filters_view_result_array = filters_view_result.to_dict(orient="records")

    for filter_view_row in filters_view_result_array:
        index = filter_view_row["view_id"] - 1
        if len(FILTER_VIEWS) < index + 1:
            # means that view doesn't exist in the list
            view = {
                "name": filter_view_row["view_name"],
                "categoryGroups": [],
                "otherCategoryGroups": []
            }
            FILTER_VIEWS.append(view)

        current_view = FILTER_VIEWS[index]

        if filter_view_row["is_primary"]:
            current_view["categoryGroups"].append({
                "name": filter_view_row["category_name"],
                "categories": [filter_view_row["filter_id"]],
            })
        else:
            does_already_exist = False
            for idx, grp in enumerate(current_view["otherCategoryGroups"]):
                if grp["name"] == filter_view_row["category_name"]:
                    does_already_exist = True
                    current_view["otherCategoryGroups"][idx]["categories"].append(filter_view_row["filter_id"])
            if not does_already_exist:
                current_view["otherCategoryGroups"].append({
                    "name": filter_view_row["category_name"],
                    "categories": [filter_view_row["filter_id"]],
                })

    return FILTERS_SKELETON