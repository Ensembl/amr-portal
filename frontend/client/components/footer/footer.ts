import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('amr-footer')
export class Footer extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 50px;
      color: var(--color-white);
    }

    footer {
      display: grid;
      grid-template-columns: 1fr auto;
      column-gap: 2.5rem;
      height: 100%;
      padding-left: var(--standard-gutter);
      padding-right: var(--double-standard-gutter);
      white-space: nowrap;
    }

    .section {
      display: flex;
      align-items: center;
      column-gap: 1.5rem;
    }

    .bold {
      font-weight: var(--font-weight-bold);
    }
  `;

  render() {
    return html`
      <footer>
        <div class="section">
          <span class="bold">
            © EMBL 2025
          </span>
          <span>
            Wellcome Genome Campus, Hinxton, Cambridgeshire, CB10 1SD, UK
          </span>
          <span>
            Tel: +44 (0)1223 49 44 44
          </span>
        </div>
        <div class="section">
          EMBL-EBI is part of the European Molecular Biology Laboratory
        </div>
      </footer>
    `;
  }

}