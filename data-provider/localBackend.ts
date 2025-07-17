import { filtersConfig } from './filtersConfig';

import type { AsyncDuckDB } from "@duckdb/duckdb-wasm"; '@duckdb/duckdb-wasm';

import type { AntibioticFilter } from '../types/filters/antibioticFilter';
import type { SpeciesFilter } from '../types/filters/speciesFilter';
import type { BiosampleDBRecord, BiosampleRecord } from '../types/biosample';

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

  getFiltersConfig = async () => {
    // making this async to pretend that we fetched this from some remote source
    return filtersConfig;
  }


  getAntibioticFilters = async () => {
    const sqlString = `SELECT DISTINCT Antibiotic_name, Antibiotic_abbreviation FROM '${this.filePath}' ORDER BY Antibiotic_name`;
    const dbRecords: Array<{ Antibiotic_name: string, Antibiotic_abbreviation: string }> = await this.#readFromDb(sqlString);

    return dbRecords.map(this.#buildAntibioticFilter);
  }

  getSpeciesFilters = async () => {
    const sqlString = `SELECT DISTINCT genus, species FROM '${this.filePath}' ORDER BY genus, species`;
    const dbRecords: Array<SpeciesFilter> = await this.#readFromDb(sqlString);
    return dbRecords;
  }

  getBiosamplesByAntibioticNames = async (antibioticNames: string[]) => {
    const columnNames = this.#getBiosampleDbRecordFields();
    const antibioticNamesString = antibioticNames.map(name => `'${name}'`).join(', ');
    const sqlString = `
      SELECT
      ${columnNames}
      FROM '${this.filePath}'
      WHERE Antibiotic_name in (${antibioticNamesString})
      LIMIT 1000`;

    const dbRecords: BiosampleDBRecord[] = await this.#readFromDb(sqlString);

    return dbRecords.map(record => this.#buildBiosampleRecord(record));
  }

  getBiosamplesBySpeciesNames = async (speciesNames: Array<{ genus: string, species: string | null }>) => {
    const speciesQueryString = speciesNames.map(({ genus, species }) => {
      const speciesString = species ? `species = '${species}'` : `species is NULL`;
      return `(genus = '${genus}' and ${speciesString})`
    }).join(' OR ');

    const columnNames = this.#getBiosampleDbRecordFields();
    const sqlString = `
      SELECT
      ${columnNames}
      FROM '${this.filePath}'
      WHERE ${speciesQueryString}
      LIMIT 1000`;

    const dbRecords: BiosampleDBRecord[] = await this.#readFromDb(sqlString);

    return dbRecords.map(record => this.#buildBiosampleRecord(record));
  }

  #buildAntibioticFilter = (dbRecord: { Antibiotic_name: string, Antibiotic_abbreviation: string }): AntibioticFilter => {
    return {
      name: dbRecord.Antibiotic_name,
      abbreviation: dbRecord.Antibiotic_abbreviation
    };
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
