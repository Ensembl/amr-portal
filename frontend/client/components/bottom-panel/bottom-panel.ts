import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';
import { SignalWatcher } from '@lit-labs/signals';
import { effect } from 'signal-utils/subtle/microtask-effect';

import biosampleStore from '../../state/biosampleStore';
import filtersStore from '../../state/filtersStore';

import '@ensembl/ensembl-elements-common/components/external-link/external-link.js';
import '@ensembl/ensembl-elements-common/components/select/select.js';
import '@ensembl/ensembl-elements-common/components/paginator/paginator.js';
import '@ensembl/ensembl-elements-common/components/table/sortable-column-header.js';

import tableStyles from '@ensembl/ensembl-elements-common/styles/constructable-stylesheets/table.js';

import type { BackendInterface } from '../../../data-provider/dataProvider';
import type { AMRRecord, AMRRecordField, LinkData } from '../../../types/amrRecord';
import type { AMRRecordsResponse } from '../../../data-provider/backendInterface';

import { panelStyles } from '../panel/shared-panel-styles';

@customElement('bottom-panel')
export class BottomPanel extends SignalWatcher(LitElement) {

  biosamplesResource: ReturnType<typeof biosampleStore.createBiosampleResource> | null = null;

  static styles = [
    tableStyles,
    panelStyles,
    css`
      :host {
        box-sizing: border-box;
        display: grid;
        grid-template-rows: auto 1fr;
        height: 100%;
        padding-top: 24px;
        padding-left: 30px;
        padding-right: 30px;
        overflow: hidden;
      }

      .table-controls-area {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        column-gap: 1.5rem;
        padding-bottom: 1rem;
      }

      .table-container {
        overflow: auto;
        height: 100%;
        white-space: nowrap;
      }

      .per-page-container {
        display: flex;
        align-items: center;
        column-gap: 1rem;
      }

      .per-page-label {
        font-weight: var(--font-weight-light);
      }
    `
  ];

  @property({ type: Object })
  dataProvider!: BackendInterface;

  unwatchFiltersStore: ( () => void ) | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.initialise();
  }

  disconnectedCallback(): void {
    this.unwatchFiltersStore?.();
    super.disconnectedCallback();
  }

  initialise() {
    this.unwatchFiltersStore = effect(() => {
      const filters = filtersStore.selectedFiltersForViewMode.get();
      const view = filtersStore.viewMode.get();
      biosampleStore.setFilters({
        filters,
        view: view as string
      });
    });

    const biosamplesResource = biosampleStore.createBiosampleResource({
      dataProvider: this.dataProvider
    });
    this.biosamplesResource = biosamplesResource;
  }

  onPageChange = (event: CustomEvent<number>) => {
    const page = event.detail;
    biosampleStore.setPage(page);
  }

  onPerPageChange = (event: Event) => {
    const selectElement = event.target as HTMLSelectElement;
    const newValue = parseInt(selectElement.value);
    biosampleStore.setPerPage(newValue);
  }

  onOrderChange = (category: string) => {
    biosampleStore.setOrder(category);
  }
 
  render() {
    const biosamplesResource = this.biosamplesResource;
    const hasData = Boolean(biosamplesResource?.value?.data.length);

    if (!biosamplesResource || biosamplesResource?.status === 'pending' && !hasData) {
      return html`
        <p>Loading...</p>
      `
    }

    if (biosamplesResource.status === 'complete' || hasData) {
      if (!hasData) {
        return html`
          <p>No data</p>
        `
      }

      const { meta, data } = biosamplesResource.value as AMRRecordsResponse;

      return html`
        ${this.renderTableControlsArea({ responseMeta: meta })}
        <div class="table-container">
          ${this.renderTable(data)}
        </div>
      `;      
    }
  }

  renderTableControlsArea({
    responseMeta
  }: {
    responseMeta: AMRRecordsResponse['meta']
  }) {
    return html`
      <div class="table-controls-area">
        ${this.renderPerPageSelector()}
        ${this.renderPaginator({ responseMeta })}
        ${this.renderTotalHitsCount({ responseMeta })}
      </div>
    `;
  }

  renderPerPageSelector() {
    const values = [100, 200, 500, 1000];
    const currenValue = biosampleStore.perPage.get();

    const optionElements = values.map(value => html`
      <option
        value=${value}
        ?selected=${value===currenValue}
      >
        ${value}
      </option>
    `);

    return html`
      <div class="per-page-container">
        <ens-select>
          <select
            aria-label="Table rows per page"
            @change=${this.onPerPageChange}
          >
            ${optionElements}
          </select>
        </ens-select>
        <span class="per-page-label">
          per page
        </span>
      </div>
    `;
  }

  renderPaginator({
    responseMeta
  }: {
    responseMeta: AMRRecordsResponse['meta']
  }) {
    const currentPage = biosampleStore.page.get();
    const { per_page, total_hits } = responseMeta;
    const totalPages = Math.ceil(total_hits / per_page);

    return html`
      <ens-paginator
        current-page=${currentPage}
        total-pages=${totalPages}
        @ens-paginator-page-change=${this.onPageChange}
      ></ens-paginator>
    `;
  }


  renderTable(data: AMRRecord[]) {
    return html`
      <table class="ens-table">
        <thead class="sticky-table-head">
          <tr>
            ${this.renderTableColumnNames(data[0])}
          </tr>
        </thead>
        <tbody>
          ${data.map(rowData => this.renderTableRow(rowData))}
        </tbody>
      </table>
    `;
  }

  /**
   * The implementation is temporary, until we start getting the list of columns from the backend
   * 
   * Remember that when we want to add sorting by columns, to put something like this inside of th elements: 
   *  <ens-table-sortable-column-head
        sort-order=${ifDefined(this.getSortOrderFor('Antibiotic_name'))}
        @click=${() => this.onOrderChange('Antibiotic_name')}
      >
        Antibiotic
      </ens-table-sortable-column-head>
   * 
   */
  renderTableColumnNames = (fields: AMRRecord) => {
    const columnsMap = filtersStore.amrTableColumnsMap.get();

    if (!columnsMap) {
      // this should not happen
      return null;
    }

    console.log('columnsMap', columnsMap);

    return repeat(fields, (field) => field.column_id, (field) => {
      console.log('field.column_id', field.column_id);
      const column = columnsMap[field.column_id];

      return html`
        <th>${ column.label }</th>
      `;
    });
  };

  renderTableRow = (record: AMRRecord) => {
    const cells = repeat(record, (field) => field.column_id, (field) => {
      let cellContent;
      if (this.isLink(field)) {
        cellContent = this.renderLink(field);
      } else {
        cellContent = field.value;
      }

      return html`
        <td>${ cellContent }</td>
      `;
    });

    return html`
      <tr>
        ${cells}
      </tr>
    `;
  };

  isLink(data: AMRRecordField): data is LinkData {
    return data.type === 'link';
  }

  renderLink(data: LinkData) {
    if (!data.value) {
      return null;
    } else if (!data.url) {
      // semantically, this should not happen; but nothing in the data types guards against this 
      return data.value;
    }

    return html`
      <ens-external-link href="${data.url}">
        ${data.value}
      </ens-external-link>
    `;
  }

  renderTotalHitsCount = ({
    responseMeta
  }: {
    responseMeta: AMRRecordsResponse['meta']
  }) => {
    const { total_hits } = responseMeta;

    return html`
      <span class="total-hits">
        <span>${ total_hits }</span>
        <span class="total-hits-label">
          results
        </span>
      </span>
    `
  }

  getSortOrderFor = (category: string) => {
    const sortOrder = biosampleStore.order.get();
    if (sortOrder?.category === category) {
      return sortOrder.order;
    } else {
      return null;
    }
  };

}