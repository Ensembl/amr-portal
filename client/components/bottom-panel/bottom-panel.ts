import { html, css, LitElement, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { LocalBackend } from '../../../data-provider/dataProvider';
import type { BiosampleRecord } from '../../../types/biosample';


type QueryParams = {
  mode: 'antibiotics';
  filters: string[];
} | {
  mode: 'species';
  filters: Array<{ genus: string; species: string | null }>;
};


@customElement('bottom-panel')
export class BottomPanel extends LitElement {

  @property({ type: Object })
  queryParams: QueryParams | null = null;

  @property({ type: Object })
  dataProvider: LocalBackend;

  @state()
  biosampleRecords: BiosampleRecord[] = [];


  protected willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('queryParams')) {
      if (this.queryParams?.filters.length) {
        this.fetchData();
      } else {
        this.biosampleRecords = [];
      }
    }
  }

  fetchData = async() => {
    if (this.queryParams.mode === 'antibiotics') {
      this.biosampleRecords = await this.dataProvider.getBiosamplesByAntibioticNames(this.queryParams.filters);
    } else if (this.queryParams.mode === 'species') {
      this.biosampleRecords = await this.dataProvider.getBiosamplesBySpeciesNames(this.queryParams.filters);
    }
  }
 

  render() {
    if (!this.biosampleRecords) {
      return html`
        <p>No data</p>
      `
    }

    return html`
      <table>
        <tbody>
          ${this.biosampleRecords.map(rowData => html`
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