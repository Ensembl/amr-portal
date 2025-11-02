/**
 * This is the router for the main client-side app.
 * Its only responsibility so far is to respond to the `view` query parameter,
 * and to change the view accordingly.
 */

import filtersStore from '../state/filtersStore';

import type { FiltersConfig, FiltersView } from '../types/filters/filtersConfig';

class Router {

  static config: FiltersConfig;

  static init(config: FiltersConfig) {
    this.config = config;
    this.#setListeners();
  }

  // This method sets listener for the popstate event, which is produced on back/forward navigation
  // If we just use replaceState, this method won't be necessary
  static #setListeners() {
    window.addEventListener('popstate', () => {
      this.setViewFromUrl();
    });      
  }

  static setViewFromUrl() {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    const viewParam = searchParams.get('view');

    const config = this.config;

    const validValidViewIds = config.filterViews.map(view => view.id);

    let viewId;
    
    if (viewParam) {
      viewId = validValidViewIds.find(id => String(id) === viewParam);
    }

    // in case there is no view parameter in the url, or if it is invalid
    if (!viewId) {
      viewId = validValidViewIds[0];
    }

    // set view
    this.setView(viewId);
  }

  static setView(viewId: FiltersView['id']) {
    // 1) Run a history replace with a new id
    const url = new URL(window.location.href);
    url.searchParams.set('view', String(viewId));
    window.history.replaceState(null, '', url);

    // 2) Set new view
    filtersStore.setViewMode(viewId);
  }

}

export default Router;