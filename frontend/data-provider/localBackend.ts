import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";

import { filtersConfig } from './filtersConfig';

import { BackendInterface, AMRRecordsFetchParams, AMRRecordsResponse } from './backendInterface';
import type { BiosampleDBRecord, BiosampleRecord } from '../types/biosample';
import type { SelectedFilter } from '../client'; // FIXME: this type should move out of the component

export class LocalBackend implements BackendInterface {
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

  // check db schema in database-schema.md
  #getAMRDbRecordFields = () => {
    return [
      'BioSample_ID',
      'Study_ID',
      'genus',
      'species',
      'Antibiotic_name',
      'Antibiotic_abbreviation',
      'Assembly_ID',
      'phenotype',
      'measurement_sign',
      'measurement_value',
      'measurement_unit',
      'isolation_context',
      'isolation_source',
      'platform',
      'laboratory_typing_method',
      'laboratory_typing_platform',
      'SRA_run',
      'SRA_sample',
      'collection_date',
      'isolation_latitude',
      'isolation_longitude',
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
    return filtersConfig;
  }

  getAMRRecords = async (params: AMRRecordsFetchParams): Promise<AMRRecordsResponse> => {
    const { filters } = params;
    const columnNames = this.#getAMRDbRecordFields();
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
      LIMIT 100
    `;

    console.log('sql statement', sqlString);

    const dbRecords: BiosampleDBRecord[] = await this.#readFromDb(sqlString);
    const amrRecords = dbRecords.map(record => this.#buildAMRRecord(record));

    return {
      meta: {
        page: 1,
        per_page: 100,
        total_hits: 1000
      },
      data: amrRecords
    };
  }

  #buildAMRRecord = (dbRecord: BiosampleDBRecord): BiosampleRecord => {
    return {
      biosample_id: dbRecord.BioSample_ID,
      study_id: dbRecord.Study_ID,
      genus: dbRecord.genus,
      species: dbRecord.species,
      antibiotic_name: dbRecord.Antibiotic_name,
      antibiotic_abbreviation: dbRecord.Antibiotic_abbreviation,
      assembly: dbRecord.Assembly_ID ? {
        accession_id: dbRecord.Assembly_ID,
        url: `https://www.ebi.ac.uk/ena/browser/view/${dbRecord.Assembly_ID}`
      } : null,
      phenotype: dbRecord.phenotype,
      measurement: {
        value: dbRecord.measurement_value,
        sign: dbRecord.measurement_sign,
        unit: dbRecord.measurement_unit
      },
      isolation_context: dbRecord.isolation_context,
      isolation_source: dbRecord.isolation_source,
      platform: dbRecord.platform,
      laboratory_typing_method: dbRecord.laboratory_typing_method,
      laboratory_typing_platform: dbRecord.laboratory_typing_platform,
      sra_run: dbRecord.SRA_run,
      sra_sample: dbRecord.SRA_sample,
      collection_date: dbRecord.collection_date,
      isolation_latitude: dbRecord.isolation_latitude,
      isolation_longitude: dbRecord.isolation_longitude,
    };
  }

}