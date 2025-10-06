import { BackendInterface, AMRRecordsFetchParams, AMRRecordsResponse } from './backendInterface';
import type { FiltersConfig } from '../types/filters/filtersConfig';

export class ApiBackend implements BackendInterface {
  apiUrl: string;

  constructor() {
    const hostname = window.location.hostname;
    const isDev = hostname === 'localhost';

    const devApiUrl = 'http://localhost:8000';
    const prodApiUrl = '/api';    

    this.apiUrl = isDev ? devApiUrl : prodApiUrl;
  }

  getFiltersConfig = async (): Promise<FiltersConfig> => {
    const response = await fetch(`${this.apiUrl}/filters-config`);
    if (!response.ok) {
      throw new Error(`Failed to fetch filters config: ${response.statusText}`);
    }
    return await response.json();
  };

  getAMRRecords = async (params: AMRRecordsFetchParams): Promise<AMRRecordsResponse> => {
    const payload: Record<string, unknown> = {
      selected_filters: params.filters,
      view_id: params.viewId,
      page: params.page,
      per_page: params.perPage
    };

    if (params.orderBy) {
      payload.order_by = params.orderBy;
    }

    const response = await fetch(`${this.apiUrl}/amr-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch biosamples: ${response.statusText}`);
    }
    return await response.json();
  };

  /**
   * This method is almost identical to getAMRRecords; perhaps they should be combined
   */
  getAMRRecordsAsBlob = async (params: AMRRecordsFetchParams): Promise<Blob> => {
    const payload: Record<string, unknown> = {
      view_id: params.viewId,
      selected_filters: params.filters,
      page: params.page,
      per_page: params.perPage
    };

    if (params.orderBy) {
      payload.order_by = params.orderBy;
    }

    const response = await fetch(`${this.apiUrl}/amr-records/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch biosamples: ${response.statusText}`);
    }
    return await response.blob();
  }
}
