import { html, css, LitElement, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { SelectedFiltersState } from '../../../index';
import type { FiltersConfig } from '../../../../types/filters/filtersConfig';
import type { FilterChangeEventPayload } from '../../../../types/events/filterChangeEvent';

type QueryParams = {
  mode: 'antibiotics';
  filters: string[];
} | {
  mode: 'species';
  filters: Array<{ genus: string; species: string | null }>;
};

// height: 100%;
// column-width: 14em;


      // display: flex;
      // flex-direction: column;
      // flex-wrap: wrap;
      // column-gap: 1rem;


@customElement('filters-area')
export class FiltersArea extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      /* background-color: green; */
      overflow-x: scroll;
    }

    .filters-category {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      column-gap: 1rem;
      height: 100%;
    }
  `;

  @property({ type: String })
  viewMode: string;

  @property({ type: String })
  activeFiltersGroup: string | null;

  @property({ type: Object })
  filtersConfig: FiltersConfig;

  @property({ type: Object })
  selectedFilters: SelectedFiltersState;

  #onFilterChange = ({
    name,
    value,
    event
  }: {
    name: string,
    value: string,
    event: Event
  }) => {
    const eventTarget = event.target as HTMLInputElement;
    const isChecked = eventTarget.checked;

    const eventPayload: FilterChangeEventPayload = {
      category: name,
      value,
      isSelected: isChecked
    };

    this.dispatchEvent(new CustomEvent('filter-changed', {
      detail: eventPayload,
      composed: true,
      bubbles: true
    }));
  }

  #getFilterGroup = () => {
    const filterView = this.filtersConfig.filterViews.find(view => view.name === this.viewMode);

    if (this.activeFiltersGroup) {
      return filterView.otherCategoryGroups.find(group => group.name === this.activeFiltersGroup);
    } else {
      return filterView.categoryGroups[0]; // FIXME: it seems that we only ever need one
    }
  }

  #getSelectedFilters = () => {
    return this.selectedFilters[this.viewMode] ?? [];
  }
 
  render() {
    const filterGroup = this.#getFilterGroup();
    const filterCategoryIds = filterGroup.categories;

    const filterCategoryBlocks = filterCategoryIds.map(id => {
      const filterCategory = this.filtersConfig.filterCategories[id];

      return html`
        <div class="filters-category">
          ${this.renderFiltersInCategory(id)}
        </div>  
      `
    });

    return html`
      ${filterCategoryBlocks}
    `;
  }

  renderFiltersInCategory(categoryId: string) {
    const category = this.filtersConfig.filterCategories[categoryId];
    const selectedFilters = this.#getSelectedFilters();

    return category.filters.map(filter => {
      const isSelected = !!selectedFilters.find(selectedFilter => {
        return selectedFilter.category === categoryId && selectedFilter.value === filter.value;
      })

      return html`
        <label>
          <input
            type="checkbox"
            @change=${(event: Event) => this.#onFilterChange({
              name: category.id,
              value: filter.value,
              event
            })}
            ?checked=${isSelected}
          />
          ${filter.label}
        </label>
      `
    });
  }

}