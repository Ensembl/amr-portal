import { html, css, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';

import { getDataProvider, BackendInterface } from '../data-provider/dataProvider';

import filtersStore from './state/filtersStore';

import './components/header/header';
import './components/top-panel/top-panel';
import './components/bottom-panel/bottom-panel';
import './components/footer/footer';

import '@ensembl/ensembl-elements-common/styles/resets.css';
import '@ensembl/ensembl-elements-common/styles/custom-properties.css';
import '@ensembl/ensembl-elements-common/styles/global.css';
import '@ensembl/ensembl-elements-common/styles/fonts.css';
import './styles/global.css';

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
      height: 100%;
      display: grid;
      grid-template-rows: auto 1fr auto;
    }

    main {
      box-sizing: border-box;
      height: 100%;
      padding-top: 10px;
      display: grid;
      grid-template-rows: minmax(auto, 35%) 1fr;
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
      <header>
        <amr-header></amr-header>
      </header>
      <main>
        <top-panel></top-panel>
        <bottom-panel
          .dataProvider=${this.dataProvider}
          .selectedFilters=${selectedFilters}
        ></bottom-panel>
      </main>
      <footer>
        <amr-footer></amr-footer>
      </footer>
    `;
  }

}
