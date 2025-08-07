import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";

import { filtersConfig } from '../filtersConfig';

import { BackendInterface, AMRRecordsFetchParams, AMRRecordsResponse } from '../backendInterface';
import type { BiosampleDBRecord } from '../../types/biosample';
import type { AMRRecord } from "../../types/amrRecord";
import type { SelectedFilter } from '../../client'; // FIXME: this type should move out of the component

export class LocalBackend implements BackendInterface {
  db: AsyncDuckDB;

  // should be passed during initialisation
  filePath = 'https://amr-portal.s3.eu-west-2.amazonaws.com/amr_v2.parquet'

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

  #buildAMRRecord = (dbRecord: BiosampleDBRecord): AMRRecord => {
    const biosampleId = {
      type: 'string',
      id: 'biosample_id',
      value: dbRecord.BioSample_ID
    } as const;
    const genus = {
      type: 'string',
      id: 'genus',
      value: dbRecord.genus
    } as const;
    const species = {
      type: 'string',
      id: 'species',
      value: dbRecord.species
    } as const;
    const antibioticName = {
      type: 'string',
      id: 'antibiotic_name',
      value: dbRecord.Antibiotic_name
    } as const;
    const antibioticAbbreviation = {
      type: 'string',
      id: 'antibiotic_abbreviation',
      value: dbRecord.Antibiotic_abbreviation
    } as const;
    const assembly = {
      type: 'link',
      id: 'assembly',
      value: dbRecord.Assembly_ID,
      url: dbRecord.Assembly_ID ? `https://www.ebi.ac.uk/ena/browser/view/${dbRecord.Assembly_ID}` : null
    } as const;
    const phenotype = {
      type: 'string',
      id: 'phenotype',
      value: dbRecord.phenotype
    } as const;

    let measurementString: string | null = null;
    
    if (dbRecord.measurement_value) {
      const signString = dbRecord.measurement_sign ? `${dbRecord.measurement_sign} ` : '';
      const unitString = dbRecord.measurement_unit ? ` ${dbRecord.measurement_unit}` : '';
      measurementString = `${signString}${dbRecord.measurement_value}${unitString}`;
    }
    
    const measurement = {
      type: 'string',
      id: 'measurement',
      value: measurementString
    } as const;
    const isolationContext = {
      type: 'string',
      id: 'isolation_context',
      value: dbRecord.isolation_context
    } as const;
    const isolationSource = {
      type: 'string',
      id: 'isolation_source',
      value: dbRecord.isolation_source
    } as const;
    const platform = {
      type: 'string',
      id: 'platform',
      value: dbRecord.platform
    } as const;
    const laboratoryTypingMethod = {
      type: 'string',
      id: 'laboratory_typing_method',
      value: dbRecord.platform
    } as const;
    const laboratoryTypingPlatform = {
      type: 'string',
      id: 'laboratory_typing_platform',
      value: dbRecord.laboratory_typing_platform
    } as const;
    const sraRun = {
      type: 'string',
      id: 'sra_run',
      value: dbRecord.SRA_run
    } as const;
    const collectionDate = {
      type: 'string',
      id: 'collection_date',
      value: dbRecord.collection_date ? `${dbRecord.collection_date}` : null
    } as const;
    const isolationLatitude = {
      type: 'string',
      id: 'isolation_latitude',
      value: dbRecord.isolation_latitude
    } as const;
    const isolationLongitude = {
      type: 'string',
      id: 'isolation_longitude',
      value: dbRecord.isolation_longitude
    } as const;

    return [
      biosampleId,
      genus,
      species,
      antibioticName,
      antibioticAbbreviation,
      assembly,
      phenotype,
      measurement,
      isolationContext,
      isolationSource,
      platform,
      laboratoryTypingMethod,
      laboratoryTypingPlatform,
      sraRun,
      collectionDate,
      isolationLatitude,
      isolationLongitude
    ];
  }

}