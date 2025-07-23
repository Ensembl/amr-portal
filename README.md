# amr-portal
A portal for viewing antimicrobial resistance (AMR) data

## Local setup

```
git clone https://github.com/Ensembl/amr-portal.git
cd amr-portal
```

### Backend

```
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
fastapi dev main.py
```

Swagger UI: http://localhost:8000/docs

#### API Calls Examples

##### `/filters-config`
```
curl -X 'GET' \
  'http://localhost:8000/filters-config' \
  -H 'accept: application/json'
```

##### `/amr-records`
```
curl -X 'POST' \
  'http://localhost:8000/amr-records' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "selected_filters": [
    { "category": "genus", "value": "Streptococcus" },
    { "category": "Antibiotic_abbreviation", "value": "OXA" },
    { "category": "Antibiotic_abbreviation", "value": "AMK" }
  ],
  "order_by": {
    "category": "collection_date",
    "order": "DESC"
  }
}'
```

### Frontend

```
cd frontend
npm install
npm run dev
```

#### Switching between API and Local DB (experimental)

Change the value in `.env`
* `api`: Uses the backend
* `local`: Loads the data straight to the frontend

```
VITE_DATA_PROVIDER=api
```
