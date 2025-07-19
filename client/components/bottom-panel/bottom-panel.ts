import { html, css, LitElement, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { LocalBackend } from '../../../data-provider/dataProvider';
import type { BiosampleRecord } from '../../../types/biosample';
import type { SelectedFilter } from '../../index';



@customElement('bottom-panel')
export class BottomPanel extends LitElement {

  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
    }
  `;

  @property({ type: Array })
  selectedFilters: SelectedFilter[];

  @property({ type: Object })
  dataProvider: LocalBackend;

  @state()
  biosampleRecords: BiosampleRecord[] = [];


  protected willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('selectedFilters')) {
      if (this.selectedFilters.length) {
        this.fetchData();
      } else {
        this.biosampleRecords = [];
      }
    }
  }

  fetchData = async() => {
    this.biosampleRecords = await this.dataProvider
      .getBiosamples(this.selectedFilters);
  }
 
  render() {
    if (!this.biosampleRecords.length) {
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