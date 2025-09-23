import { html, css, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import emblLogoUrl from '@ensembl/ensembl-elements-common/icons/EMBL_EBI_logo.svg';

@customElement('amr-header')
export class Header extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
      background-color: var(--color-white);
      padding: 0 var(--standard-gutter);
    }

    .embl-logo {
      height: 30px;
      margin-left: 65px;
    }

    .left-wrapper {
      display: flex;
      align-items: center;
    }

    .title-wrapper {
      display: flex;
      align-items: baseline;
    }

    .portal-title {
      font-size: 16px;
      font-weight: var(--font-weight-bold);
      padding: 0 30px 0 20px;
      border-right: 1px solid var(--color-black);
    }

    .page-title {
      font-size: 14px;
      padding-left: 30px;
    }

    .right-wrapper {
      display: flex;
      column-gap: 30px;
      align-items: center;
    }

    .data-release-label {
      font-size: 11px;
      font-weight: var(--font-weight-light);
    }

    .data-release-date {
      font-size: 12px;
      margin-left: 1ch;
    }

    .pseudo-button {
      display: inline-flex;
      align-items: center;
      height: 22px;
      padding: 0 22px;
      border: 1px solid var(--color-medium-dark-grey);
      border-radius: 30px;
      color: var(--color-medium-dark-grey);
    }
  `;

  render() {
    return html`
      <div class="left-wrapper">
        <img src=${emblLogoUrl} class="embl-logo" />
        <h1 class="title-wrapper">
          <span class="portal-title">
            Anti-microbial resistance portal
          </span>

          <span class="page-title">
            Data resources
          </span>
        </h1>
      </div>


      <div class="right-wrapper">
        <span class="data-release">
          <span class="data-release-label">
            Latest data release ${' '}
          </span>
          <span class="data-release-date">
            2025-07
          </span>
        </span>

        <span class="pseudo-button" aria-hidden="true">
          Submit data
        </span>
      </div>
    `;
  }

}