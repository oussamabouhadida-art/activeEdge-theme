/**
 * cart-drawer.js — ActiveEdge Theme
 * Cart drawer open/close, add item, update qty, remove item
 * Uses Shopify Cart API (/cart/add.js, /cart/update.js, /cart/change.js)
 * Dispatches cart:updated event on every cart change
 */

'use strict';

class CartDrawer {
  constructor() {
    this.drawer = document.getElementById('cart-drawer');
    this.toggleBtn = document.getElementById('cart-drawer-toggle');
    this.closeBtn = this.drawer ? this.drawer.querySelector('.cart-drawer__close') : null;
    this.continueBtn = this.drawer ? this.drawer.querySelector('.cart-drawer__continue') : null;
    this.isOpen = false;
    this.isLoading = false;

    if (!this.drawer) return;
    this.init();
  }

  /* ---- Setup ---- */
  init() {
    // Toggle button in header
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.open());
    }

    // Close button inside drawer
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    // Continue shopping
    if (this.continueBtn) {
      this.continueBtn.addEventListener('click', () => this.close());
    }

    // Keyboard escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });

    // Listen for add-to-cart triggers from product forms
    document.addEventListener('cart:add', (e) => {
      this.addItem(e.detail).then(() => this.open());
    });

    // Delegated event listeners for qty buttons and remove
    if (this.drawer) {
      this.drawer.addEventListener('click', (e) => this.handleDrawerClick(e));
      this.drawer.addEventListener('change', (e) => this.handleDrawerChange(e));
    }
  }

  /* ---- Open / Close ---- */
  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.drawer.classList.add('active');
    this.drawer.removeAttribute('aria-hidden');
    if (this.toggleBtn) this.toggleBtn.setAttribute('aria-expanded', 'true');

    if (window.ActiveEdge && window.ActiveEdge.Overlay) {
      window.ActiveEdge.Overlay.open(() => this.close());
    }

    if (window.ActiveEdge && window.ActiveEdge.trapFocus) {
      window.ActiveEdge.trapFocus(this.drawer);
    }

    // Fetch latest cart state
    this.fetchAndRender();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.drawer.classList.remove('active');
    this.drawer.setAttribute('aria-hidden', 'true');
    if (this.toggleBtn) {
      this.toggleBtn.setAttribute('aria-expanded', 'false');
      this.toggleBtn.focus();
    }

    if (window.ActiveEdge && window.ActiveEdge.removeTrapFocus) {
      window.ActiveEdge.removeTrapFocus(this.drawer);
    }
  }

  /* ---- Cart API Calls ---- */
  async fetchCart() {
    const res = await fetch('/cart.js', {
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch cart');
    return res.json();
  }

  async addItem({ id, quantity = 1, properties = {} }) {
    this.setLoading(true);
    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, quantity, properties })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.description || 'Could not add item');
      }
      await res.json();
      const cart = await this.fetchCart();
      this.dispatchCartUpdated(cart);
      await this.renderCartFromData(cart);
      return cart;
    } catch (err) {
      console.error('[CartDrawer] addItem error:', err);
      this.showError(err.message);
    } finally {
      this.setLoading(false);
    }
  }

  async updateItem(key, quantity) {
    this.setLoading(true);
    try {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity })
      });
      if (!res.ok) throw new Error('Failed to update item');
      const cart = await res.json();
      this.dispatchCartUpdated(cart);
      await this.renderCartFromData(cart);
      return cart;
    } catch (err) {
      console.error('[CartDrawer] updateItem error:', err);
    } finally {
      this.setLoading(false);
    }
  }

  async removeItem(key) {
    return this.updateItem(key, 0);
  }

  async fetchAndRender() {
    this.setLoading(true);
    try {
      const cart = await this.fetchCart();
      await this.renderCartFromData(cart);
    } catch (err) {
      console.error('[CartDrawer] fetchAndRender error:', err);
    } finally {
      this.setLoading(false);
    }
  }

  /* ---- Rendering ---- */
  async renderCartFromData(cart) {
    const body = this.drawer.querySelector('.cart-drawer__body');
    const countEl = this.drawer.querySelector('.cart-drawer__count');
    const subtotalEl = this.drawer.querySelector('.cart-drawer__subtotal-amount');

    if (countEl) countEl.textContent = cart.item_count;

    if (subtotalEl) {
      subtotalEl.textContent = this.formatMoney(cart.total_price);
    }

    if (!body) return;

    if (cart.item_count === 0) {
      body.innerHTML = this.renderEmpty();
      return;
    }

    body.innerHTML = `<ul class="cart-drawer__items" aria-label="Cart items">
      ${cart.items.map(item => this.renderItem(item)).join('')}
    </ul>`;
  }

  renderEmpty() {
    return `
      <div class="cart-drawer__empty">
        <div class="cart-drawer__empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <p class="cart-drawer__empty-title">Votre panier est vide</p>
        <p class="cart-drawer__empty-text">Ajoutez des produits pour commencer.</p>
      </div>`;
  }

  renderItem(item) {
    const imgSrc = item.image ? item.image.replace('.jpg', '_80x80.jpg') : '';
    const price = this.formatMoney(item.final_line_price);
    const hasCompare = item.original_line_price > item.final_line_price;
    const comparePriceHtml = hasCompare
      ? `<span class="cart-item__price--compare">${this.formatMoney(item.original_line_price)}</span>`
      : '';

    const variantHtml = item.variant_title && item.variant_title !== 'Default Title'
      ? `<span class="cart-item__variant">${item.variant_title}</span>`
      : '';

    return `
      <li class="cart-item" data-key="${item.key}">
        <div class="cart-item__image-wrap">
          ${imgSrc ? `<img src="${imgSrc}" alt="${this.escapeHtml(item.title)}" class="cart-item__image" width="80" height="80" loading="lazy">` : ''}
        </div>
        <div class="cart-item__details">
          <a href="${item.url}" class="cart-item__title">${this.escapeHtml(item.product_title)}</a>
          ${variantHtml}
          <div class="cart-item__price-row">
            <span class="cart-item__price">${price}</span>
            ${comparePriceHtml}
          </div>
          <div class="cart-item__qty">
            <div class="cart-item__qty-wrap">
              <button class="cart-item__qty-btn" data-action="decrease" aria-label="Diminuer la quantité">−</button>
              <input
                type="number"
                class="cart-item__qty-input"
                value="${item.quantity}"
                min="0"
                aria-label="Quantité"
                data-key="${item.key}"
              >
              <button class="cart-item__qty-btn" data-action="increase" aria-label="Augmenter la quantité">+</button>
            </div>
            <button class="cart-item__remove" data-key="${item.key}" aria-label="Supprimer ${this.escapeHtml(item.title)}">
              Supprimer
            </button>
          </div>
        </div>
      </li>`;
  }

  /* ---- Event Delegation ---- */
  handleDrawerClick(e) {
    // Qty buttons
    const qtyBtn = e.target.closest('.cart-item__qty-btn');
    if (qtyBtn) {
      const item = qtyBtn.closest('.cart-item');
      if (!item) return;
      const input = item.querySelector('.cart-item__qty-input');
      if (!input) return;
      const key = item.dataset.key;
      const action = qtyBtn.dataset.action;
      let qty = parseInt(input.value, 10);
      qty = action === 'increase' ? qty + 1 : Math.max(0, qty - 1);
      input.value = qty;
      this.updateItem(key, qty);
      return;
    }

    // Remove button
    const removeBtn = e.target.closest('.cart-item__remove');
    if (removeBtn) {
      const key = removeBtn.dataset.key;
      if (key) this.removeItem(key);
      return;
    }
  }

  handleDrawerChange(e) {
    const input = e.target.closest('.cart-item__qty-input');
    if (!input) return;
    const key = input.dataset.key;
    const qty = parseInt(input.value, 10);
    if (!isNaN(qty) && key) {
      this.updateItem(key, qty);
    }
  }

  /* ---- Helpers ---- */
  setLoading(val) {
    this.isLoading = val;
    this.drawer.classList.toggle('loading', val);
  }

  showError(msg) {
    // Simple error display — can be enhanced
    console.warn('[CartDrawer]', msg);
  }

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

  dispatchCartUpdated(cart) {
    document.dispatchEvent(new CustomEvent('cart:updated', {
      bubbles: true,
      detail: {
        item_count: cart.item_count,
        total_price: cart.total_price,
        items: cart.items
      }
    }));
  }
}

/* ============================================
   Init
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  window.cartDrawer = new CartDrawer();
});
