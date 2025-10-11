import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';

import { getDataProvider, BackendInterface } from '../data-provider/dataProvider';

import filtersStore from '../state/filtersStore';

import '../components/header/header';
import '../components/top-panel/top-panel';
import '../components/bottom-panel/bottom-panel';
import '../components/footer/footer';

import '@ensembl/ensembl-elements-common/embl-ebi-components/page-header/page-header.js';
import '@ensembl/ensembl-elements-common/embl-ebi-components/page-footer/page-footer.js';

export type SelectedFilter = {
  category: string;
  value: string;
};

// We are expected to store filters independently against different views
export type SelectedFiltersState = Record<string, SelectedFilter[]>;

@customElement('amr-app')
export class AMRApp extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      box-sizing: border-box;
      padding-top: 10px;
      padding-bottom: 20px;
      display: grid;
      grid-template-rows: auto 1fr;
      row-gap: 20px;
      overflow: hidden;
    }
  `;

  @state()
  dataProvider: BackendInterface | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.initialise();
  }

  initialise = async () => {
    await this.getDataProvider();
    const filtersConfig = await this.dataProvider!.getFiltersConfig();
    const defaultViewMode = filtersConfig.filterViews[0].id;
    
    filtersStore.setFiltersConfig(filtersConfig);
    filtersStore.setViewMode(defaultViewMode);
  }

  getDataProvider = async () => {
    // const provider = 'local';
    const provider = 'api';
    this.dataProvider = await getDataProvider({ provider });
  }  

  render() {
    const filtersConfig = filtersStore.filtersConfig.get();

    if (!this.dataProvider || !filtersConfig) {
      return html`
        <p>Loading...</p>
      `;
    }

    const selectedFilters = filtersStore.selectedFiltersForViewMode.get();

    return html`
      <top-panel></top-panel>
      <bottom-panel
        .dataProvider=${this.dataProvider}
        .selectedFilters=${selectedFilters}
      ></bottom-panel>
    `;
  }

}
