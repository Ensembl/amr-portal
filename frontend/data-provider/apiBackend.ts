import type { BiosampleRecord } from '../types/biosample';
import type { SelectedFilter } from '../client';

export class ApiBackend {
  apiUrl: string;

  constructor(apiUrl = 'http://localhost:8000') {
    this.apiUrl = apiUrl;
  }

  getFiltersConfig = async (): Promise<Record<string, unknown>> => {
    const response = await fetch(`${this.apiUrl}/filters-config`);
    if (!response.ok) {
      throw new Error(`Failed to fetch filters config: ${response.statusText}`);
    }
    return await response.json();
  };

  getBiosamples = async (
    filters: SelectedFilter[],
    page = 1,
    perPage = 100,
    order_by?: { category: string; order: 'ASC' | 'DESC' }
  ): Promise<{ data: BiosampleRecord[]; meta: { total_hits: number; page: number; per_page: number } }> => {
    const payload = {
      selected_filters: filters,
      page,
      per_page: perPage,
      ...(order_by ? { order_by } : {})
    };

    const response = await fetch(`${this.apiUrl}/amr-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch biosamples: ${response.statusText}`);
    }
    // console.log('response: ', response.json());
    return await response.json();
  };
}
