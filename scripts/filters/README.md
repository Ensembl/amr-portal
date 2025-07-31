## Generate filters

This tool is used to generate filter information for the AMR portal. 

### Usage

This script uses [UV](https://docs.astral.sh/uv/) for dependency management

```
usage: generate_filters.py [-h] [-c CONFIG] [-d DATA] [-v SCHEMA] [-o OUTPUT]

Tool for generating AMR filter data

options:
  -h, --help           show this help message and exit
  -c, --config CONFIG  A JSON file that defines the filter categories and views
  -d, --data DATA      parquet file containing AMR data
  -v, --schema SCHEMA  JSON Schema used to validate input
  -o, --output OUTPUT  File name for output. Defaults to filters.json
```
Example

```
uv run python generate_filters.py -c filters-no-age-source.json -d ~/Data/amr/step1_merge_all_v7.parquet -o results.json
```