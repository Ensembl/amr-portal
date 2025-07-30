import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('amr-header')
export class Header extends LitElement {
  static styles = css`
    :host {
      display: block;
      height: 60px;
      background-color: var(--color-white);
    }
  `;

  render() {
    return html`
      <div>
        This is header
      </div>
    `;
  }

}