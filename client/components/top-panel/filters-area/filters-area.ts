import { html, css, LitElement, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { LocalBackend } from '../../../../data-provider/dataProvider';
import type { AntibioticFilter } from '../../../../types/filters/antibioticFilter';
import type { SpeciesFilter } from '../../../../types/filters/speciesFilter';
import type { SelectionMode } from '../selection-modes/selection-modes';

type QueryParams = {
  mode: 'antibiotics';
  filters: string[];
} | {
  mode: 'species';
  filters: Array<{ genus: string; species: string | null }>;
};

// height: 100%;
// column-width: 14em;
      


@customElement('filters-area')
export class FiltersArea extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      flex-wrap: wrap;
      column-gap: 1rem;
      height: 200px;
    }
  `;

  @property({ type: String })
  selectionMode: SelectionMode;

  @property({ type: Object })
  dataProvider: LocalBackend;

  @state()
  antibioticFilters: AntibioticFilter[] = [];


  @state()
  speciesFilters: SpeciesFilter[] = [];

  #selectedAntibioticFilters: string[] = [];
  #selectedSpeciesFilters: SpeciesFilter[] = [];

  protected willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('selectionMode')) {
      this.fetchData();
    }
  }

  onAntibioticChanged = (name: string, event: Event) => {
    const eventTarget = event.target as HTMLInputElement;
    const isChecked = eventTarget.checked;

    if (isChecked) {
      this.#selectedAntibioticFilters.push(name);
    } else {
      this.#selectedAntibioticFilters = this.#selectedAntibioticFilters.filter(antibiotic => antibiotic !== name);
    }

    const eventPayload = {
      mode: 'antibiotics',
      filters: this.#selectedAntibioticFilters
    };

    this.dispatchEvent(new CustomEvent('query-changed', {
      detail: eventPayload
    }));
  }

  onSpeciesChanged = (params: { genus: string, species: string | null, event: Event }) => {
    const { genus, species, event } = params;
    const eventTarget = event.target as HTMLInputElement;
    const isChecked = eventTarget.checked;

    if (isChecked) {
      this.#selectedSpeciesFilters.push({ genus, species });
    } else {
      this.#selectedSpeciesFilters = this.#selectedSpeciesFilters.filter(filter => {
        return filter.genus !== genus && filter.species !== species
      });
    }

    const eventPayload = {
      mode: 'species',
      filters: this.#selectedSpeciesFilters
    };

    this.dispatchEvent(new CustomEvent('query-changed', {
      detail: eventPayload
    }));
  }

  fetchData = async() => {
    if (this.selectionMode === 'antibiotics') {
      this.antibioticFilters = await this.dataProvider.getAntibioticFilters();
    } else if (this.selectionMode === 'species') {
      this.speciesFilters = await this.dataProvider.getSpeciesFilters();
    }
  }
 
  render() {
    if (this.selectionMode === 'antibiotics') {
      return this.renderAntibioticFilters();
    } else if (this.selectionMode === 'species') {
      return this.renderSpeciesFilters();
    }
  }

  renderAntibioticFilters() {
    return this.antibioticFilters.map(filter => html`
      <label>
        <input type="checkbox" @change=${event => this.onAntibioticChanged(filter.name, event)} />
        ${filter.name} ${filter.abbreviation}
      </label>
    `);
  }

  renderSpeciesFilters() {
    return this.speciesFilters.map(filter => html`
      <label>
        <input type="checkbox" @change=${(event: Event) => this.onSpeciesChanged({
          genus: filter.genus,
          species: filter.species,
          event
        })} />
        ${filter.genus} ${filter.species}
      </label>
    `);
  }


}