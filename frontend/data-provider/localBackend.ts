import { filtersConfig } from './filtersConfig';

import type { AsyncDuckDB } from "@duckdb/duckdb-wasm"; '@duckdb/duckdb-wasm';

import type { BiosampleDBRecord, BiosampleRecord } from '../types/biosample';
import type { SelectedFilter } from '../client'; // FIXME: this type should move out of the component

export class LocalBackend {
  db: AsyncDuckDB;

  // should be passed during initialisation
  filePath = 'https://amr-portal.s3.eu-west-2.amazonaws.com/step1_merge_all_v7.parquet'

  constructor ({ db }: { db: AsyncDuckDB }) {
    this.db = db
  }

  #readFromDb = async (sqlString: string) => {
    const connection = await this.db.connect();
    const arrowResult = await connection.query(sqlString);
    const result = arrowResult.toArray().map((row) => row.toJSON());
    await connection.close();
    return result;
  }

  #getBiosampleDbRecordFields = () => {
    return [
      'Antibiotic_name',
      'Antibiotic_abbreviation',
      'phenotype',
      'measurement_sign',
      'measurement_value',
      'measurement_unit',
      'genus',
      'species',
      'Assembly_ID',
      'isolation_context',
      'BioSample_ID',
      'Study_ID'
    ].join(', ');
  }

  /**
   * Transform an array of filters into an object that groups filter values by filter category,
   * in order to facilitate the building of a SQL statement
   */
  #groupFilters = (filters: SelectedFilter[]): Record<string, string[]> => {
    const result: Record<string, string[]> = {};

    for (const filter of filters) {
      const { category, value } = filter;
      if (!result[category]) {
        result[category] = [];
      }

      result[category].push(value);
    }

    return result;
  }

  getFiltersConfig = async () => {
    // making this async to pretend that we fetched this from some remote source
    return await fetch('http://localhost:8000/filters-config').then(
        response => response.json()
    );
  }

  getBiosamples = async (filters: SelectedFilter[]) => {
    console.log('about to get biosamples');
    const columnNames = this.#getBiosampleDbRecordFields();
    const filterGroups = this.#groupFilters(filters);

    let whereFragments = '';

    // building a WHERE clause, e.g. Antibiotic_abbreviation IN ('CCV', 'AMP', 'SMX') AND phenotype IN ('high level resistance', 'resistant')
    for (const [category, values] of Object.entries(filterGroups)) {
      const valuesString = values.map(value => `'${value}'`).join(', ')
      const fragment = `${category} IN (${valuesString})`;
      if (!whereFragments.length) {
        whereFragments = fragment;
      } else {
        whereFragments = `${whereFragments} AND ${fragment}`;
      }
    }

    const sqlString = `
      SELECT
      ${columnNames}
      FROM '${this.filePath}'
      WHERE ${whereFragments}
      LIMIT 1000
    `;

    console.log('sql statement', sqlString);

    const dbRecords: BiosampleDBRecord[] = await this.#readFromDb(sqlString);
    return dbRecords.map(record => this.#buildBiosampleRecord(record));
  }

  #buildBiosampleRecord = (dbRecord: BiosampleDBRecord): BiosampleRecord => {
    return {
      biosample_id: dbRecord.BioSample_ID,
      study_id: dbRecord.Study_ID,
      genus: dbRecord.genus,
      species: dbRecord.species,
      antibiotic_name: dbRecord.Antibiotic_name,
      antibiotic_abbreviation: dbRecord.Antibiotic_abbreviation,
      phenotype: dbRecord.phenotype,
      assembly_accession_id: dbRecord.Assembly_ID,
      measurement: {
        value: dbRecord.measurement_value,
        sign: dbRecord.measurement_sign,
        unit: dbRecord.measurement_unit
      },
      isolation_context: dbRecord.isolation_context,
      isolation_source: dbRecord.isolation_source,
      laboratory_typing_method: dbRecord.laboratory_typing_method,
      laboratory_typing_platform: dbRecord.laboratory_typing_platform,
      sra_run: dbRecord.SRA_run,
      sra_sample: dbRecord.SRA_sample,
    };
  }

}


/**

{
    "Antibiotic_name": "Omadacycline",
    "Antibiotic_abbreviation": "OMC",
    "phenotype": "resistant",
    "measurement_sign": "=",
    "measurement_value": "16.0",
    "measurement_unit": null,
    "genus": "Klebsiella",
    "species": "pneumoniae",
    "Assembly_ID": null,
    "isolation_context": null,
    "BioSample_ID": "SAMN05170244",
    "Study_ID": "SRP074197"
}


 */
