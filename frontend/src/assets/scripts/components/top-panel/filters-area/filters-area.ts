import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { repeat } from 'lit/directives/repeat.js';

import '@ensembl/ensembl-elements-common/components/checkbox/checkbox.js'

import filtersStore from '../../../state/filtersStore';

import './filters-area-top';

import type { FilterChangeEventPayload } from '../../../types/events/filterChangeEvent';
import { FiltersConfig } from '../../../types/filters/filtersConfig';

@customElement('filters-area')
export class FiltersArea extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: grid;
      grid-template-rows: auto 1fr;
      row-gap: 30px;
      height: 100%;
      overflow: hidden;
      padding-bottom: 10px;
    }

    .main {
      height: 100%;
      overflow-x: auto;
      display: flex;
      padding-left: 36px;
      padding-bottom: 10px;
    }

    .filters-category {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      column-gap: 3rem;
      row-gap: 10px;
      height: 100%;
    }

    filters-area-top {
      margin-left: 20px;
      margin-top: 20px;
    }
  `;

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

    const payload: FilterChangeEventPayload = {
      category: name,
      value,
      isSelected: isChecked
    };

    filtersStore.updateSelectedFilters(payload);
  }

  #getFilterGroup = () => {
    const filtersConfig = filtersStore.filtersConfig.get() as FiltersConfig;
    const viewMode = filtersStore.viewMode.get();
    return filtersStore.activeFilterGroup.get();
  }
 
  render() {
    const filterGroup = this.#getFilterGroup();
    const filterCategoryIds = filterGroup.categories;

    const filterCategoryBlocks = repeat(filterCategoryIds, (id) => id, (id) => {
      return html`
        <div class="filters-category">
          ${this.renderFiltersInCategory(id)}
        </div>  
      `
    });

    return html`
      <filters-area-top></filters-area-top>
      <div class="main">
        ${filterCategoryBlocks}
      </div>
    `;
  }

  renderFiltersInCategory(categoryId: string) {
    const filtersConfig = filtersStore.filtersConfig.get();
    const category = filtersConfig!.filterCategories[categoryId];

    const selectedFilters = filtersStore.selectedFiltersForViewMode.get();

    return repeat(category.filters, (filter) => filter.value, (filter) => {
      const isSelected = !!selectedFilters.find(selectedFilter => {
        return selectedFilter.category === categoryId && selectedFilter.value === filter.value;
      });

      return html`
        <ens-checkbox
          @change=${(event: Event) => {
            this.#onFilterChange({
              name: category.id,
              value: filter.value,
              event
            })
          }}
          ?checked=${isSelected}
        >
          ${filter.label}
        </ens-checkbox>
      `
    });
  }

}