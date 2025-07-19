import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import type { FiltersConfig } from '../../../../types/filters/filtersConfig';


@customElement('top-panel-navigation')
export class TopPanelNavigation extends LitElement {

  @property({ type: String })
  currentViewMode: string;

  @property({ type: Object })
  filtersConfig: FiltersConfig;

  @property({ type: Boolean })
  isViewingExtraFilters: boolean;

  onViewModeChange = (mode: string) => {
    const event = new CustomEvent('view-mode-change', {
      detail: mode,
      composed: true,
      bubbles: true
    });

    this.dispatchEvent(event);
  }

  onFiltersClick = () => {
    const event = new Event('extra-filters-click', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }


  render() {
    const viewModeButtons = this.filtersConfig.filterViews.map(view => html`
      <button
        @click=${() => this.onViewModeChange(view.name)}
        ?disabled=${this.currentViewMode === view.name && !this.isViewingExtraFilters}
      >
        ${view.name}
      </button>        
    `);


    return html`
      <div>
        ${viewModeButtons}
        <button style="margin-top: 1.5rem;" @click=${this.onFiltersClick}>
          Filters
        </button>
      </div>
    `;
  }

}