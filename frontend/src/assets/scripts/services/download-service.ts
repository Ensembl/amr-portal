import appConfig from '../configs/app-config';

import type { FiltersView } from '../types/filters/filtersConfig';
import type { SelectedFilter } from '../state/filtersStore'


type DownloadOptions = {
  viewId: FiltersView['id'];
  selectedFilters: SelectedFilter[];
}


class DownloadService extends EventTarget {

  canUseFileSystemApi = false;

  ongoingDownloads = new Set<string>();

  constructor() {
    super();
    this.#checkFileSystemApi();
  }

  #getDownloadUrl() {
    // will normalise appConfig.apiBaseUrl that does or doesn't have a hostname
    const url = new URL(`${appConfig.apiBaseUrl}/amr-records/download`, document.baseURI);
    return url;
  }

  #checkFileSystemApi() {
    if ('showSaveFilePicker' in globalThis) {
      this.canUseFileSystemApi = true;
    }
  }

  getDownloadId(params: DownloadOptions) {
    return JSON.stringify(params);
  }

  isDownloading(params: DownloadOptions) {
    const downloadId = this.getDownloadId(params);
    return this.ongoingDownloads.has(downloadId);
  }

  // Used for browsers that do not have file system api
  createDownloadLink({
    viewId,
    selectedFilters
  }: DownloadOptions) {
    const payload = {
      view_id: viewId as string | number,
      selected_filters: selectedFilters,
    };
    const stringifiedPayload = JSON.stringify(payload);
    const base64Payload = btoa(stringifiedPayload);
    const url = this.#getDownloadUrl();
    url.searchParams.set('scope', 'all');
    url.searchParams.set('file_format', 'csv');
    url.searchParams.set('payload', base64Payload);

    return url.toString();
  }

  async download({
    viewId,
    selectedFilters
  }: DownloadOptions) {
    if (!globalThis.showSaveFilePicker) {
      throw Error('Browser does not support file system access api required for download to proceed');
    }

    const downloadId = this.getDownloadId({
      viewId,
      selectedFilters
    });
    this.ongoingDownloads.add(downloadId);

    // Ask user where to save
    const handle = await showSaveFilePicker({
      id: 'amr-download', // will remember the directory in case of subsequent downloads 
      suggestedName: 'amr-results.csv'
    });
    const writableStream = await handle.createWritable();


    const payload: Record<string, unknown> = {
      view_id: viewId,
      selected_filters: selectedFilters,
    };

    const downloadUrl = this.#getDownloadUrl();

    try {
      const response = await fetch(downloadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      if (response.body) {
        for await (const chunk of response.body) {
          await writableStream.write(chunk); 
        }
      }
  
      await writableStream.close();

      const event = new CustomEvent('download-success', {
        detail: {
          downloadId
        }
      });
      this.dispatchEvent(event);
    } catch {
      const event = new CustomEvent('download-failure', {
        detail: {
          downloadId
        }
      });
      this.dispatchEvent(event);
    } finally {
      this.ongoingDownloads.delete(downloadId);
    }
  }

}

const downloadService = new DownloadService();

export default downloadService;