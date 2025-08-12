/* @refresh reload */
import { render } from 'solid-js/web';

import App from './App';

import '@ensembl/ensembl-elements-common/styles/resets.css';
import '@ensembl/ensembl-elements-common/styles/custom-properties.css';
import '@ensembl/ensembl-elements-common/styles/global.css';
import '@ensembl/ensembl-elements-common/styles/fonts.css';
import './index.css';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?'
  );
}

render(() => <App />, root!);
