import { html, css, LitElement, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import './selection-modes/selection-modes';
import './filters-area/filters-area';

import type { SelectionMode } from './selection-modes/selection-modes';
import type { LocalBackend } from '../../../data-provider/dataProvider';

type QueryParams = {
  mode: 'antibiotics';
  filters: string[];
} | {
  mode: 'species';
  filters: Array<{ genus: string; species: string | null }>;
};



@customElement('top-panel')
export class TopPanel extends LitElement {
  static styles = css`
    :host {
      height: 100%;
      display: grid;
      grid-template-columns: 100px 1fr;
    }
  `;

  @property({ type: Object })
  dataProvider: LocalBackend;

  @state()
  selectionMode: SelectionMode;

  onSelectionModeChanged = (event: CustomEvent) => {
    const newEvent = new CustomEvent(event.type, {
      detail: event.detail
    });
    this.dispatchEvent(newEvent);
  }

  onQueryChanged = (event: CustomEvent) => {
    const newEvent = new CustomEvent('query-changed', {
      detail: event.detail
    });
    this.dispatchEvent(newEvent);
  }

  render() {
    return html`
      <selection-modes
        .currentMode=${this.selectionMode}
        @selection-mode-change=${this.onSelectionModeChanged}
      >
      </selection-modes>
      <filters-area
        .dataProvider=${this.dataProvider}
        .selectionMode=${this.selectionMode}
        @query-changed=${this.onQueryChanged}
      ></filters-area>
    `;
  }

}