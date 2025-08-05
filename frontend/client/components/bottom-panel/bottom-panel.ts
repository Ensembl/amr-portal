import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
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
import type { BiosampleRecord } from '../../../types/biosample';

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
        grid-template-columns: auto 1fr;
        column-gap: 1.5rem;
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
      biosampleStore.setFilters(filters);
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
    const hasData = Boolean(biosamplesResource?.value?.length)
    console.log('biosamplesResource?.status', biosamplesResource?.status);

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

      return html`
        ${this.renderTableControlsArea()}
        <div class="table-container">
          ${this.renderBiosampleRecords(biosamplesResource.value ?? [])}
        </div>
      `;      
    }
  }

  renderTableControlsArea() {
    return html`
      <div class="table-controls-area">
        ${this.renderPerPageSelector()}
        ${this.renderPaginator()}
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

  renderPaginator() {
    const currentPage = biosampleStore.page.get();

    return html`
      <ens-paginator
        current-page=${currentPage}
        total-pages=${1000}
        @ens-paginator-page-change=${this.onPageChange}
      ></ens-paginator>
    `;
  }


  renderBiosampleRecords(biosampleRecords: BiosampleRecord[]) {
    return html`
      <table class="ens-table">
        <thead class="sticky-table-head">
          <tr>
            <th>Biosample id</th>
            <th>
              <ens-table-sortable-column-head
                sort-order=${ifDefined(this.getSortOrderFor('Antibiotic_name'))}
                @click=${() => this.onOrderChange('Antibiotic_name')}
              >
                Antibiotic
              </ens-table-sortable-column-head>
            </th>
            <th>Abbrev</th>
            <th>
              <ens-table-sortable-column-head
                sort-order=${ifDefined(this.getSortOrderFor('phenotype'))}
                @click=${() => this.onOrderChange('phenotype')}
              >
                Phenotype
              </ens-table-sortable-column-head>
            </th>
            <th>
              <ens-table-sortable-column-head
                sort-order=${ifDefined(this.getSortOrderFor('genus'))}
                @click=${() => this.onOrderChange('genus')}
              >
                Genus
              </ens-table-sortable-column-head>
            </th>
            <th>Species</th>
            <th>Assembly accession in ENA</th>
            <th>MIC</th>
            <th>Isolation context</th>
            <th>Isolation source</th>
            <th>Lab typing method</th>
            <th>Lab typing platform</th>
          </tr>
        </thead>
        <tbody>
          ${biosampleRecords.map(rowData => html`
            <tr>
              <td>
                ${rowData.biosample_id}
              </td>
              <td>
                ${rowData.antibiotic_name}
              </td>
              <td>
                ${rowData.antibiotic_abbreviation}
              </td>
              <td>
                ${rowData.phenotype}
              </td>
              <td>
                ${rowData.genus}
              </td>
              <td>
                ${rowData.species}
              </td>
              <td>
                ${this.renderAssemblyLink(rowData.assembly)}
              </td>
              <td>
                ${rowData.measurement.sign ?? ''}
                ${rowData.measurement.value}
                ${' '}
                ${rowData.measurement.unit ?? ''}
              </td>
              <td>
                ${rowData.isolation_context}
              </td>
              <td>
                ${rowData.isolation_source}
              </td>
              <td>
                ${rowData.laboratory_typing_method}
              </td>
              <td>
                ${rowData.laboratory_typing_platform}
              </td>
            </tr>
          `)}

        </tbody>
      </table>
    `;
  }

  renderAssemblyLink(assembly: BiosampleRecord['assembly']) {
    if (!assembly) {
      return null;
    }

    return html`
      <ens-external-link href="${assembly.url}">
        ${assembly.accession_id}
      </ens-external-link>
    `;
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