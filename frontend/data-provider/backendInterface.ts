import type { BiosampleRecord } from '../types/biosample';
import type { SelectedFilter } from '../client';
import type { FiltersConfig } from '../types/filters/filtersConfig';

export type AMRRecordsFetchParams = {
  filters: SelectedFilter[];
  page: number;
  perPage: number;
  orderBy?: { category: string; order: 'ASC' | 'DESC' }
};

type PagniatedMetadata = {
  total_hits: number;
  page: number;
  per_page: number
};

export type AMRRecordsResponse = {
  meta: PagniatedMetadata;
  data: BiosampleRecord[];
};

export interface BackendInterface {
  getFiltersConfig: () => Promise<FiltersConfig>;
  getAMRRecords: (params: AMRRecordsFetchParams) => Promise<AMRRecordsResponse>;
};