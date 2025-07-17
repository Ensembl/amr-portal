import { html, css, LitElement, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { FiltersConfig } from '../../../../types/filters/filtersConfig';


@customElement('top-panel-navigation')
export class TopPanelNavigation extends LitElement {

  @property({ type: String })
  currentViewMode: string;

  @property({ type: Object })
  filtersConfig: FiltersConfig;

  onViewModeChange = (mode: string) => {
    const event = new CustomEvent('view-mode-change', {
      detail: mode,
      composed: true,
      bubbles: true
    });

    this.dispatchEvent(event);
  }

  render() {
    return this.filtersConfig.filterViews.map(view => html`
      <button
        @click=${() => this.onViewModeChange(view.name)}
        ?disabled=${this.currentViewMode === view.name}
      >
        ${view.name}
      </button>        
    `);
  }

}