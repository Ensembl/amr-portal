# amr-portal
A portal for viewing antimicrobial resistance (AMR) data

## Local setup

```
git clone https://github.com/Ensembl/amr-portal.git
cd amr-portal
```

### Backend

1. Install requirements
```
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Create a .env File
```
# .env
DUCKDB_PATH=path/to/duckdb/file.duckdb
```

Or

```shell
export DUCKDB_PATH=path/to/duckdb/file.duckdb
```

```shell
# make sure you're in the *root directory*
cd ..
uvicorn backend.main:app --reload
```

Swagger UI: http://localhost:8000/docs

For production use:
```shell
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### API Calls Examples

##### `/filters-config`
```
curl -X 'GET' \
  'http://localhost:8000/filters-config' \
  -H 'accept: application/json'
```

##### `/amr-records`
###### Fetching _Phenotype_ data
```
curl -X 'POST' \
  'http://localhost:8000/amr-records' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "selected_filters": [
    { "category": "genus", "value": "Streptococcus" },
    { "category": "Antibiotic_abbreviation", "value": "OXA" },
    { "category": "phenotype-Antibiotic_abbreviation", "value": "AMK" }
  ],
  "view": "phenotype",
  "order_by": {
    "category": "collection_date",
    "order": "DESC"
  }
}'
```

###### Fetching _Genotype_ data
```
curl -X 'POST' \
  'http://localhost:8000/amr-records' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "selected_filters": [
    { "category": "genome", "value": "BU_CCUG35501" },
    { "category": "genome", "value": "PV_WCA-389-WT-3C" }
  ],
  "view": "genotype",
  "order_by": {
    "category": "genome",
    "order": "DESC"
  }
}'
```

##### `/download`
###### Download data in the current page in `CSV` format
```
curl -X 'POST' \
  'http://localhost:8000/amr-records/download' \
  -H 'Content-Type: application/json' \
  -d '{
  "selected_filters": [
    { "category": "genus", "value": "Streptococcus" },
    { "category": "Antibiotic_abbreviation", "value": "OXA" },
    { "category": "Antibiotic_abbreviation", "value": "AMK" }
  ],
  "view": "phenotype",
  "order_by": {
    "category": "collection_date",
    "order": "DESC"
  }
}'
```

###### Download all matches in `JSON` format
```
curl -X 'POST' \
  'http://localhost:8000/amr-records/download?scope=all&file_format=json' \
  -H 'Content-Type: application/json' \
  -d '{
  "selected_filters": [
    { "category": "genus", "value": "Streptococcus" }
  ],
  "view": "phenotype",
  "order_by": {
    "category": "collection_date",
    "order": "DESC"
  }
}'
```

### Frontend

Prerequisite: need to have Node installed. As a rule of thumb, always use the latest LTS version of Node.

```
cd frontend
npm install
npm run dev
```

## Production build

### Frontend

```
cd frontend
npm install
npm run build
```

This will create a `dist` directory containing a static html file and all the assets that it loads.