import type { BackendInterface, AMRRecordsFetchParams, AMRRecordsResponse } from './backendInterface';
import type { FiltersConfig } from '../types/filters/filtersConfig';

export class ApiBackend implements BackendInterface {
  apiUrl: string;

  constructor() {
    const hostname = window.location.hostname;
    const isDev = hostname === 'localhost';

    // TODO: this should probably be read from the environment
    const devApiUrl = 'http://localhost:8000/api';
    const prodApiUrl = '/amr/api';

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

//   /**
//    * This method is almost identical to getAMRRecords; perhaps they should be combined
//    */
//   getAMRRecordsAsBlob = async (params: AMRRecordsFetchParams): Promise<Blob> => {
//     const payload: Record<string, unknown> = {
//       view_id: params.viewId,
//       selected_filters: params.filters,
//       page: params.page,
//       per_page: params.perPage
//     };
//
//     if (params.orderBy) {
//       payload.order_by = params.orderBy;
//     }
//
//     const response = await fetch(`${this.apiUrl}/amr-records/download`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload)
//     });
//
//     if (!response.ok) {
//       throw new Error(`Failed to fetch biosamples: ${response.statusText}`);
//     }
//     return await response.blob();
//   }

  getAMRRecordsAsBlob = async (params: AMRRecordsFetchParams): Promise<Blob> => {
    // Build the payload object
    const payload: Record<string, unknown> = {
      view_id: params.viewId,
      selected_filters: params.filters,
      page: params.page,
      per_page: params.perPage
    };

    if (params.orderBy) {
      payload.order_by = params.orderBy;
    }

    // Encode the payload as a URL-safe JSON string
    const encodedPayload = encodeURIComponent(JSON.stringify(payload));

    // Default query params
    const scope = params.scope ?? "all";
    const fileFormat = params.fileFormat ?? "csv";

    // Construct the URL with all query parameters
    const url = `${this.apiUrl}/amr-records/download?scope=${scope}&file_format=${fileFormat}&payload=${encodedPayload}`;

    // Perform GET request
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      throw new Error(`Failed to download AMR records: ${response.status} ${response.statusText}`);
    }

    // Return the blob so caller can trigger download
    return await response.blob();
  };
}
