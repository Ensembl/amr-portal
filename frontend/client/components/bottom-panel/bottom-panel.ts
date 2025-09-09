import { html, css, render, LitElement, PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { SignalWatcher } from '@lit-labs/signals';
import { effect } from 'signal-utils/subtle/microtask-effect';
import { ifDefined } from 'lit/directives/if-defined.js';

import biosampleStore from '../../state/biosampleStore';
import filtersStore from '../../state/filtersStore';

import '@ensembl/ensembl-elements-common/components/external-link/external-link.js';
import '@ensembl/ensembl-elements-common/components/select/select.js';
import '@ensembl/ensembl-elements-common/components/paginator/paginator.js';
import '@ensembl/ensembl-elements-common/components/table/sortable-column-header.js';
import './action-buttons/action-buttons';

import tableStyles from '@ensembl/ensembl-elements-common/styles/constructable-stylesheets/table.js';

import type { BackendInterface } from '../../../data-provider/dataProvider';
import type { AMRRecord, AMRRecordField, LinkData } from '../../../types/amrRecord';
import type { AMRRecordsResponse } from '../../../data-provider/backendInterface';
import type { FiltersView } from '../../../types/filters/filtersConfig';

import { panelStyles } from '../panel/shared-panel-styles';

@customElement('bottom-panel')
export class BottomPanel extends SignalWatcher(LitElement) {

  biosamplesResource: ReturnType<typeof biosampleStore.createBiosampleResource> | null = null;

  static styles = [
    tableStyles,
    panelStyles,
    css`
      :host {
        position: relative;
        box-sizing: border-box;
        display: grid;
        grid-template-rows: auto 1fr;
        height: 100%;
        padding-top: 24px;
        padding-left: 30px;
        padding-right: 30px;
        container-type: size;  // <-- will allow .table-container to know its height, and therefore for overflow: auto to work
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

      .error {
        color: var(--color-red);
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

  disconnectedCallback() {
    this.unwatchFiltersStore?.();
    super.disconnectedCallback();
  }

  protected update(changedProperties: PropertyValues) {
    try {
      super.update(changedProperties);
    } catch (e) {
      render(this.#renderError(), this.renderRoot, this.renderOptions);
    }
  }

  initialise() {
    this.unwatchFiltersStore = effect(() => {
      const filters = filtersStore.selectedFiltersForViewMode.get();
      const view = filtersStore.viewMode.get();
      biosampleStore.setFilters({
        filters,
        viewId: view as FiltersView['id']
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
    const isComplete = biosamplesResource?.status === 'complete'
    const hasData = Boolean(biosamplesResource?.value?.data.length);
    const isError = Boolean(biosamplesResource?.error);
    const isLoading = !biosamplesResource || biosamplesResource?.status === 'pending' && !hasData;

    try {
      return this.#doRender({
        isError,
        isComplete,
        hasData,
        isLoading,
        data: biosamplesResource?.value as AMRRecordsResponse ?? null
      })
    } catch {
      return html`
        <p>There has been an error rendering the table</p>
      `
    }
  }

  #renderError({ isLoadingError }: { isLoadingError?: boolean } = {}) {
    if (isLoadingError) {
      return html`
        <p class="error">There has been an error retrieving the data.</p>
      `;
    } else {
      return html`
        <p class="error">An error occurred during the rendering of the data.</p>
      `;
    }
  }

  #doRender({
    isError,
    isLoading,
    isComplete,
    hasData,
    data
  }: {
    isError: boolean;
    isComplete: boolean;
    hasData: boolean;
    isLoading: boolean;
    data: AMRRecordsResponse | null;
  }) {
    if (isError) {
      return this.#renderError({ isLoadingError: true });
    }

    if (isLoading) {
      return html`
        <p>Loading...</p>
      `
    }

    if (isComplete && !hasData) {
      return html`
        <p>No data</p>
      `
    }

    if (data) {
      const { meta, data: records } = data;

      return html`
        ${this.renderTableControlsArea({ responseMeta: meta })}
        <div class="table-container">
          ${this.renderTable(records)}
        </div>
        <bottom-panel-action-buttons .dataProvider=${this.dataProvider}>
        </bottom-panel-action-buttons>
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

    return repeat(fields, (field) => field.column_id, (field) => {
      const column = columnsMap[field.column_id];

      if (column.sortable) {
        return html`
          <th>
            <ens-table-sortable-column-head
              sort-order=${ifDefined(this.getSortOrderFor(field.column_id))}
              @click=${() => this.onOrderChange(field.column_id)}
            >
              ${ column.label }
            </ens-table-sortable-column-head>
          </th>
        `;
      }

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