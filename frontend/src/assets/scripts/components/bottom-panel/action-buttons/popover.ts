import { html, css, LitElement, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';

import '@ensembl/ensembl-elements-common/components/button/button.js';
import '@ensembl/ensembl-elements-common/components/text-button/text-button.js';
import '@ensembl/ensembl-elements-common/components/button-link/button-link.js';
import '@ensembl/ensembl-elements-common/components/loading-button/loading-button.js';

import { actionView } from './state';
import filtersStore from '../../../state/filtersStore';
import biosampleStore from '../../../state/biosampleStore';
import downloadService from '../../../services/download-service';
import { focusFirstEligibleChild } from '../../../utils/focus-utils';

import {
  styles as buttonsColumnStyles,
  renderButtonsColumn
} from './buttons-column';

import type { BackendInterface, AMRRecordsFetchParams } from '../../../data-provider/backendInterface';
import type { FiltersView } from '../../../types/filters/filtersConfig';

/**
 * Ideally, this would use the html popover api,
 * because the popover api comes with light-dismiss
 * and with proper handling of keyboard interactions (focus trapping, close on escape).
 * However, a native popover would require a working css anchor positioning,
 * which is still not supported by all our target browsers
 */


@customElement('bottom-panel-action-buttons-popover')
export class ActionButtonsPopover extends SignalWatcher(LitElement) {

  static styles = [
    buttonsColumnStyles,
    css`
      :host {
        --buttons-column-color: transparent;
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        background-color: var(--color-light-grey);
        border-radius: var(--panel-border-radius);
        padding-left: 40px;
        padding-bottom: 30px;
        display: grid;
        grid-template-columns: 1fr auto;
        width: 600px;
      }

      .clear-content {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: auto 1fr;
        column-gap: 60px;
        row-gap: 20px;
        grid-template-areas:
          'title title'
          'message buttons';
        padding-right: 70px;

        .title {
          grid-area: title;
          font-weight: var(--font-weight-bold);
          padding-top: 30px; // same as for the buttons column
        }

        .message {
          grid-area: message;
          color: var(--color-red);
          padding-left: 20px;
        }

        .action-buttons {
          grid-area: buttons;
          display: flex;
          align-items: center;
          align-self: start;
          column-gap: 40px;
        }
      }

      .download-content {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: auto 1fr;
        column-gap: 60px;
        row-gap: 20px;
        grid-template-areas:
          'title title'
          'checkboxes buttons';
        padding-right: 70px;

        .title {
          grid-area: title;
          font-weight: var(--font-weight-bold);
          padding-top: 30px; // same as for the buttons column
        }

        .action-buttons {
          grid-area: buttons;
          display: flex;
          align-items: center;
          align-self: start;
          column-gap: 40px;
        }
      }
    `
  ]

  @property({ type: Object })
  dataProvider!: BackendInterface;

  // To remove event listeners on unmounting
  abortController = new AbortController();

  protected firstUpdated() {
    focusFirstEligibleChild(this.shadowRoot as ShadowRoot);
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keyup', this.#onKeyPress, {
      signal: this.abortController.signal
    });

    downloadService.addEventListener('download-success', this.#onDownloadSuccess, {
      signal: this.abortController.signal
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.abortController.abort();
  }

  #onKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.#hidePopover();
    }
  }

  #hidePopover() {
    actionView.set(null);
  }

  #onClear() {
    filtersStore.clearAllFilters();
    actionView.set(null);
  }

  #getDownloadLink() {
    const viewId = filtersStore.viewMode.get() as string | number;
    const selectedFilters = filtersStore.selectedFiltersForViewMode.get();

    return downloadService.createDownloadLink({
      viewId: viewId,
      selectedFilters
    });
  }

  #getPayloadForDownload() {
   const viewId = filtersStore.viewMode.get() as string | number;
    const selectedFilters = filtersStore.selectedFiltersForViewMode.get();

    return {
      viewId,
      selectedFilters
    };
  }

  #onDownloadStart() {
    const payload = this.#getPayloadForDownload();
    downloadService.download(payload);
    this.requestUpdate();
  }

  #onDownloadSuccess = (event: Event) => {
    console.log('DOWNLOAD SUCCEEDED', event);
    const eventDetail = (event as CustomEvent<{ downloadId: string; }>).detail;
    const { downloadId: completedDownloadId } = eventDetail;

    const downloadId = downloadService.getDownloadId(this.#getPayloadForDownload());
    if (downloadId === completedDownloadId) {
      this.requestUpdate();
    }
  }

  render() {
    const view = actionView.get();

    if (view === 'clear') {
      return this.renderClearContent();
    } else if (view === 'download') {
      return this.renderDownloadContent();
    }
  }

  renderClearContent() {
    return html`
      <div class="clear-content">
        <div class="title">
          Clear all data
        </div>
        <div class="message">
          Any configuration of the table will be lost if you clear the data —
          do you wish to continue?
        </div>
        <div class="action-buttons">
          <ens-button
            variant="action"
            @click=${this.#onClear}
            autofocus
          >
            Clear
          </ens-button>
          <ens-text-button @click=${this.#hidePopover}>
            Cancel
          </ens-text-button>
        </div>
      </div>
      ${renderButtonsColumn()}
    `;
  }

  renderDownloadContent() {
    if (!downloadService.canUseFileSystemApi) {
      return this.renderDownloadFallback();
    }

    const isDownloading = downloadService.isDownloading(this.#getPayloadForDownload());

    return html`
      <div class="download-content">
        <div class="title">
          Download data
        </div>
        <div class="action-buttons">
          <ens-loading-button
            variant="action"
            @click=${this.#onDownloadStart}
            status=${isDownloading ? 'loading' : 'default'}
          >
            Download
          </ens-loading-button>
          <ens-text-button @click=${this.#hidePopover}>
            Cancel
          </ens-text-button>
        </div>
      </div>
      ${renderButtonsColumn()}
    `;
  }

  // For browsers that do not support FileSystem API
  // should turn the download button into a button-looking link
  renderDownloadFallback() {
    return html`
      <div class="download-content">
        <div class="title">
          Download data
        </div>
        <div class="action-buttons">
          <ens-button-link
            variant="action"
            href=${this.#getDownloadLink()}
            download
          >
            Download
          </ens-button-link>
          <ens-text-button @click=${this.#hidePopover}>
            Cancel
          </ens-text-button>
        </div>
      </div>
      ${renderButtonsColumn()}
    `;
  }

}