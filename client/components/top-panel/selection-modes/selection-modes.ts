import { html, css, LitElement, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export type SelectionMode =
  | 'antibiotics'
  | 'species';


@customElement('selection-modes')
export class SelectionModes extends LitElement {

  @property({ type: String })
  currentMode: SelectionMode;

  onModeChange = (mode: SelectionMode) => {
    const event = new CustomEvent('selection-mode-change', {
      detail: mode
    });

    this.dispatchEvent(event);
  }

  render() {
    return html`
      <div>
        <button
          @click=${() => this.onModeChange('antibiotics')}
          ?disabled=${this.currentMode === 'antibiotics'}
        >
          AMR antibiotics
        </button>
        <button
          @click=${() => this.onModeChange('species')}
          ?disabled=${this.currentMode === 'species'}
        >
          AMR genomes
        </button>
      </div>
    `;
  }

}