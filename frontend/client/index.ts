import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';

import { getDataProvider, BackendInterface } from '../data-provider/dataProvider';

import filtersStore from './state/filtersStore';

import './components/top-panel/top-panel';
import './components/bottom-panel/bottom-panel';

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
      height: 100%;
      display: grid;
      grid-template-rows: 35% 1fr;
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
    const defaultViewMode = filtersConfig.filterViews[0].name;
    
    filtersStore.setFiltersConfig(filtersConfig);
    filtersStore.setViewMode(defaultViewMode);
  }

  getDataProvider = async () => {
    // const provider = import.meta.env.VITE_DATA_PROVIDER as 'local' | 'api' || 'api';

    // const provider = 'local';
    const provider = 'api';
    this.dataProvider = await getDataProvider({ provider });

    console.log(`Using data provider: ${provider}`);
  }  

  render() {
    console.log('re-rendering index component')

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
