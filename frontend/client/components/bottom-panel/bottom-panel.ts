import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';

import biosampleStore from '../../state/biosampleStore';
import filtersStore from '../../state/filtersStore';

import type { BackendInterface } from '../../../data-provider/dataProvider';
import type { BiosampleRecord } from '../../../types/biosample';


@customElement('bottom-panel')
export class BottomPanel extends SignalWatcher(LitElement) {

  biosamplesResource: ReturnType<typeof biosampleStore.createBiosampleResource> | null = null;

  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
    }
  `;

  @property({ type: Object })
  dataProvider!: BackendInterface;

  connectedCallback() {
    super.connectedCallback();
    this.initialise();
  }

  initialise() {
    const biosamplesResource = biosampleStore.createBiosampleResource({
      dataProvider: this.dataProvider,
      selectedFilters: filtersStore.selectedFiltersForViewMode
    });
    this.biosamplesResource = biosamplesResource;
  }

 
  render() {
    const biosamplesResource = this.biosamplesResource;

    if (!biosamplesResource || biosamplesResource?.status === 'pending') {
      if (biosamplesResource?.value?.length) {
        return this.renderBiosampleRecords(biosamplesResource.value);
      }

      return html`
        <p>Loading...</p>
      `
    }

    if (biosamplesResource.status === 'complete') {
      const biosampleRecords = biosamplesResource.value ?? [];

      if (!biosampleRecords.length) {
        return html`
          <p>No data</p>
        `
      }

      return this.renderBiosampleRecords(biosamplesResource.value ?? []);
    }
  }


  renderBiosampleRecords(biosampleRecords: BiosampleRecord[]) {
    return html`
      <table>
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

}