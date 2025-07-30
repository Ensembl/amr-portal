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
  `;

  render() {
    return html`
      <div>
        This is footer
      </div>
    `;
  }

}