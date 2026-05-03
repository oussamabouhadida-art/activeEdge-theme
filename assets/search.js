/**
 * search.js — ActiveEdge Theme
 * Predictive search using Shopify Predictive Search API
 * Keyboard navigation, accessible results dropdown
 */

'use strict';

class PredictiveSearch {
  constructor() {
    this.input = document.getElementById('predictive-search-input');
    this.resultsContainer = document.getElementById('predictive-search-results');

    if (!this.input || !this.resultsContainer) return;

    this.query = '';
    this.currentIndex = -1;
    this.debounceTimer = null;
    this.abortController = null;
    this.minChars = 2;
    this.debounceDelay = 300;

    this.init();
  }

  init() {
    this.input.setAttribute('autocomplete', 'off');
    this.input.setAttribute('aria-autocomplete', 'list');
    this.input.setAttribute('aria-haspopup', 'listbox');
    this.input.setAttribute('aria-controls', 'predictive-search-results');
    this.input.setAttribute('aria-expanded', 'false');

    this.input.addEventListener('input', () => this.handleInput());
    this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    this.input.addEventListener('blur', (e) => {
      // Delay to allow click on results
      setTimeout(() => this.hide(), 200);
    });
    this.input.addEventListener('focus', () => {
      if (this.query.length >= this.minChars) this.show();
    });
  }

  handleInput() {
    this.query = this.input.value.trim();

    clearTimeout(this.debounceTimer);

    if (this.query.length < this.minChars) {
      this.hide();
      return;
    }

    this.debounceTimer = setTimeout(() => this.search(this.query), this.debounceDelay);
  }

  async search(query) {
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();

    try {
      this.setLoading(true);

      const params = new URLSearchParams({
        q: query,
        resources: JSON.stringify({
          type: 'product',
          limit: 6,
          options: { unavailable_products: 'last', fields: 'title,product_type,variants.title' }
        }),
        'resources[type]': 'product',
        'resources[limit]': 6,
        'resources[options][unavailable_products]': 'last',
        'resources[options][fields]': 'title,product_type,variants.title'
      });

      const url = `/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=6`;

      const res = await fetch(url, { signal: this.abortController.signal });
      if (!res.ok) throw new Error('Search request failed');

      const data = await res.json();
      this.renderResults(data, query);
    } catch (err) {
      if (err.name === 'AbortError') return; // Cancelled
      console.error('[PredictiveSearch]', err);
      this.renderError();
    } finally {
      this.setLoading(false);
    }
  }

  renderResults(data, query) {
    const products = data.resources && data.resources.results && data.resources.results.products
      ? data.resources.results.products
      : [];

    if (!products.length) {
      this.renderNoResults(query);
      return;
    }

    const html = `
      <ul class="predictive-search__results" role="listbox" id="predictive-search-list">
        ${products.map((p, i) => this.renderProductItem(p, i)).join('')}
        <li>
          <a href="/search?q=${encodeURIComponent(query)}" class="predictive-search__item predictive-search__view-all" role="option">
            <span>Voir tous les résultats pour « ${this.escapeHtml(query)} »</span>
          </a>
        </li>
      </ul>`;

    this.resultsContainer.innerHTML = html;
    this.resultsContainer.classList.add('has-results');
    this.currentIndex = -1;
    this.show();
  }

  renderProductItem(product, index) {
    const price = product.price ? this.formatMoney(product.price) : '';
    const imgHtml = product.featured_image && product.featured_image.url
      ? `<img src="${product.featured_image.url}&width=80" alt="${this.escapeHtml(product.title)}" width="48" height="48" loading="lazy">`
      : `<div style="width:48px;height:48px;background:var(--color-pale);border-radius:var(--radius-sm);flex-shrink:0;"></div>`;

    return `
      <li>
        <a href="${product.url}" class="predictive-search__item" role="option" id="predictive-search-option-${index}" data-index="${index}">
          ${imgHtml}
          <div>
            <div class="predictive-search__item-title">${this.escapeHtml(product.title)}</div>
            ${price ? `<div class="predictive-search__item-price">${price}</div>` : ''}
          </div>
        </a>
      </li>`;
  }

  renderNoResults(query) {
    this.resultsContainer.innerHTML = `
      <div class="predictive-search__no-results">
        Aucun résultat pour « ${this.escapeHtml(query)} »
      </div>`;
    this.resultsContainer.classList.add('has-results');
    this.show();
  }

  renderError() {
    this.resultsContainer.innerHTML = `
      <div class="predictive-search__no-results">
        Une erreur est survenue. Réessayez.
      </div>`;
    this.resultsContainer.classList.add('has-results');
    this.show();
  }

  setLoading(val) {
    if (val) {
      this.resultsContainer.innerHTML = `<div class="predictive-search__loading">Chargement...</div>`;
      this.resultsContainer.classList.add('has-results');
    }
  }

  /* ---- Keyboard Navigation ---- */
  handleKeydown(e) {
    const items = this.resultsContainer.querySelectorAll('.predictive-search__item');
    if (!items.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.currentIndex = Math.min(this.currentIndex + 1, items.length - 1);
        this.highlightItem(items);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.currentIndex = Math.max(this.currentIndex - 1, -1);
        if (this.currentIndex === -1) {
          this.input.focus();
        } else {
          this.highlightItem(items);
        }
        break;
      case 'Enter':
        if (this.currentIndex >= 0 && items[this.currentIndex]) {
          e.preventDefault();
          items[this.currentIndex].click();
        }
        break;
      case 'Escape':
        this.hide();
        this.input.blur();
        break;
    }
  }

  highlightItem(items) {
    items.forEach((item, i) => {
      item.classList.toggle('active', i === this.currentIndex);
    });
    if (items[this.currentIndex]) {
      items[this.currentIndex].focus();
    }
  }

  /* ---- Show / Hide ---- */
  show() {
    this.input.setAttribute('aria-expanded', 'true');
  }

  hide() {
    this.input.setAttribute('aria-expanded', 'false');
    this.resultsContainer.classList.remove('has-results');
    this.resultsContainer.innerHTML = '';
    this.currentIndex = -1;
  }

  /* ---- Helpers ---- */
  formatMoney(cents) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: window.Shopify ? (window.Shopify.currency || 'EUR') : 'EUR',
      minimumFractionDigits: 2
    }).format(cents / 100);
  }

  escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }
}

/* ============================================
   Init
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  window.predictiveSearch = new PredictiveSearch();
});
