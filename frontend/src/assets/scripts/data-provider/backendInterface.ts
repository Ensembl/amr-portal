import type { AMRRecord } from '../src/assets/scripts/types/amrRecord';
import type { SelectedFilter } from '../client';
import type { FiltersConfig, FiltersView } from '../src/assets/scripts/types/filters/filtersConfig';

export type AMRRecordsFetchParams = {
  filters: SelectedFilter[];
  viewId: FiltersView['id'];
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
  data: AMRRecord[];
};

export interface BackendInterface {
  getFiltersConfig: () => Promise<FiltersConfig>;
  getAMRRecords: (params: AMRRecordsFetchParams) => Promise<AMRRecordsResponse>;
  getAMRRecordsAsBlob: (params: AMRRecordsFetchParams) => Promise<Blob>;
};