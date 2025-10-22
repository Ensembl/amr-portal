from backend.core.utils import query_to_records
from backend.core.database import db_conn as default_db_conn


def fetch_release(db=default_db_conn) -> dict[str, str] | None:
    release_query = "SELECT release_label as label FROM release"
    release_rows = query_to_records(db, release_query)
    release = release_rows[0] if release_rows else None

    return release
