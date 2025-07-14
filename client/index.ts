import { html, css, LitElement, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { getDataProvider, type LocalBackend } from '../data-provider/dataProvider';

import './components/top-panel/top-panel';
import './components/bottom-panel/bottom-panel';

import type { SelectionMode } from './components/top-panel/selection-modes/selection-modes';

type QueryParams = {
  mode: 'antibiotics';
  filters: string[];
} | {
  mode: 'species';
  filters: Array<{ genus: string; species: string | null }>;
};


@customElement('app-shell')
export class AppShell extends LitElement {
  static styles = css`
    :host {
      height: 100%;
      display: grid;
      grid-template-rows: 35% 1fr;
    }
  `;

  @state()
  selectionMode: SelectionMode = 'antibiotics';

  @state()
  dataProvider: LocalBackend;

  @state()
  queryParams: QueryParams | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.getDataProvider();
  }

  getDataProvider = async () => {
    this.dataProvider = await getDataProvider({ provider: 'local' });
  }

  onSelectionModeChanged = (event: CustomEvent<SelectionMode>) => {
    this.selectionMode = event.detail;
  }

  onQueryChanged = (event: CustomEvent<QueryParams>) => {
    this.queryParams = event.detail;
  }
  

  render() {
    if (!this.dataProvider) {
      return html`
        <p>Loading...</p>
      `;
    }

    return html`
      <top-panel
        .dataProvider=${this.dataProvider}
        .selectionMode=${this.selectionMode}
        @query-changed=${this.onQueryChanged}
        @selection-mode-change=${this.onSelectionModeChanged}
      ></top-panel>
      <bottom-panel
        .dataProvider=${this.dataProvider}
        .queryParams=${this.queryParams}
      ></bottom-panel>
    `;
  }

}