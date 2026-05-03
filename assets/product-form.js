/**
 * product-form.js — ActiveEdge Theme
 * Variant selection, qty, add to cart, price update,
 * sticky ATC on mobile scroll, gallery thumbnail clicks
 */

'use strict';

class ProductForm {
  constructor(formEl) {
    this.form = formEl;
    this.productId = formEl.closest('[data-product-id]')
      ? formEl.closest('[data-product-id]').dataset.productId
      : null;
    this.productData = window.productData || null;
    this.selectedOptions = [];
    this.currentVariant = null;

    this.variantIdInput = formEl.querySelector('#variant-id');
    this.atcBtn = formEl.querySelector('#product-atc') || formEl.querySelector('[name="add"]');
    this.qtyInput = formEl.querySelector('.qty-selector__input');

    // Price display elements
    this.priceEl = document.querySelector('.price__regular, .price__sale');
    this.compareEl = document.querySelector('.price__compare');

    if (!this.productData) return;
    this.init();
  }

  init() {
    // Build initial selected options from active buttons
    const optionGroups = this.form.querySelectorAll('[data-option-index]');
    optionGroups.forEach(group => {
      const active = group.querySelector('.product-form__option-btn.active');
      if (active) {
        this.selectedOptions[parseInt(group.dataset.optionIndex, 10)] = active.dataset.value;
      }
    });

    this.currentVariant = this.findMatchingVariant();

    // Option button clicks
    this.form.querySelectorAll('.product-form__option-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleOptionClick(btn));
    });

    // Qty controls
    this.form.querySelectorAll('.qty-selector__btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleQtyClick(btn));
    });

    // Form submit
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Gallery thumbnails
    this.initGallery();

    // Sticky ATC
    this.initStickyAtc();
  }

  /* ---- Option Selection ---- */
  handleOptionClick(btn) {
    const group = btn.closest('[data-option-index]');
    if (!group) return;
    const idx = parseInt(group.dataset.optionIndex, 10);
    const value = btn.dataset.value;

    // Update active state
    group.querySelectorAll('.product-form__option-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    this.selectedOptions[idx] = value;
    this.currentVariant = this.findMatchingVariant();
    this.updateFormState();
  }

  findMatchingVariant() {
    if (!this.productData || !this.productData.variants) return null;
    return this.productData.variants.find(v => {
      return v.options.every((opt, i) => opt === this.selectedOptions[i]);
    }) || null;
  }

  updateFormState() {
    if (!this.currentVariant) {
      this.setUnavailable();
      return;
    }

    // Update hidden variant ID
    if (this.variantIdInput) {
      this.variantIdInput.value = this.currentVariant.id;
    }

    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('variant', this.currentVariant.id);
    window.history.replaceState({}, '', url.toString());

    // Update price
    this.updatePrice(this.currentVariant);

    // Update ATC button state
    if (this.currentVariant.available) {
      this.setAvailable();
    } else {
      this.setSoldOut();
    }

    // Update gallery image if variant has featured_image
    if (this.currentVariant.featured_image) {
      this.switchGalleryToVariant(this.currentVariant);
    }

    // Update sticky ATC
    this.updateStickyAtc(this.currentVariant);
  }

  /* ---- Price Update ---- */
  updatePrice(variant) {
    const priceContainer = document.querySelector('.product-info__price-row .price');
    if (!priceContainer) return;

    const isOnSale = variant.compare_at_price && variant.compare_at_price > variant.price;
    const formattedPrice = this.formatMoney(variant.price);
    const formattedCompare = isOnSale ? this.formatMoney(variant.compare_at_price) : '';

    if (isOnSale) {
      priceContainer.innerHTML = `
        <span class="price__sale">${formattedPrice}</span>
        <span class="price__compare">${formattedCompare}</span>
        <span class="price__savings">-${Math.round((1 - variant.price / variant.compare_at_price) * 100)}%</span>
      `;
    } else {
      priceContainer.innerHTML = `<span class="price__regular">${formattedPrice}</span>`;
    }
  }

  /* ---- ATC State ---- */
  setAvailable() {
    if (!this.atcBtn) return;
    this.atcBtn.disabled = false;
    this.atcBtn.textContent = this.getTranslation('add_to_cart', 'Ajouter au panier');
  }

  setSoldOut() {
    if (!this.atcBtn) return;
    this.atcBtn.disabled = true;
    this.atcBtn.textContent = this.getTranslation('sold_out', 'Rupture de stock');
  }

  setUnavailable() {
    if (!this.atcBtn) return;
    this.atcBtn.disabled = true;
    this.atcBtn.textContent = this.getTranslation('unavailable', 'Non disponible');
  }

  getTranslation(key, fallback) {
    try {
      return (window.theme_translations && window.theme_translations.product[key]) || fallback;
    } catch {
      return fallback;
    }
  }

  /* ---- Qty Controls ---- */
  handleQtyClick(btn) {
    if (!this.qtyInput) return;
    const action = btn.dataset.action;
    let val = parseInt(this.qtyInput.value, 10) || 1;
    val = action === 'increase' ? val + 1 : Math.max(1, val - 1);
    this.qtyInput.value = val;
  }

  /* ---- Form Submit ---- */
  handleSubmit(e) {
    e.preventDefault();

    if (!this.currentVariant || !this.currentVariant.available) return;

    const qty = this.qtyInput ? parseInt(this.qtyInput.value, 10) : 1;
    const variantId = this.variantIdInput ? parseInt(this.variantIdInput.value, 10) : this.currentVariant.id;

    // Set loading state
    if (this.atcBtn) {
      this.atcBtn.classList.add('btn--loading');
      this.atcBtn.disabled = true;
    }

    const addEvent = new CustomEvent('cart:add', {
      bubbles: true,
      detail: { id: variantId, quantity: qty }
    });
    document.dispatchEvent(addEvent);

    // Reset button after delay
    setTimeout(() => {
      if (this.atcBtn) {
        this.atcBtn.classList.remove('btn--loading');
        this.setAvailable();
      }
    }, 1200);
  }

  /* ---- Gallery ---- */
  initGallery() {
    const thumbnails = document.querySelectorAll('.product-gallery__thumb');
    if (!thumbnails.length) return;

    thumbnails.forEach((thumb, i) => {
      thumb.addEventListener('click', () => this.activateGallerySlide(i));
      thumb.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.activateGallerySlide(i);
        }
      });
    });
  }

  activateGallerySlide(index) {
    const thumbs = document.querySelectorAll('.product-gallery__thumb');
    const slides = document.querySelectorAll('.product-gallery__slide');

    thumbs.forEach((t, i) => {
      t.classList.toggle('active', i === index);
      t.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });

    slides.forEach((s, i) => {
      s.classList.toggle('active', i === index);
    });
  }

  switchGalleryToVariant(variant) {
    if (!variant.featured_image) return;
    // Match by position
    const idx = this.productData.images.findIndex(img => img.id === variant.featured_image.id);
    if (idx !== -1) this.activateGallerySlide(idx);
  }

  /* ---- Sticky ATC ---- */
  initStickyAtc() {
    this.stickyAtc = document.getElementById('sticky-atc');
    if (!this.stickyAtc) return;

    const atcButton = document.getElementById('product-atc');
    if (!atcButton) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            this.stickyAtc.classList.add('visible');
            this.stickyAtc.removeAttribute('aria-hidden');
          } else {
            this.stickyAtc.classList.remove('visible');
            this.stickyAtc.setAttribute('aria-hidden', 'true');
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px -100px 0px' }
    );

    observer.observe(atcButton);
  }

  updateStickyAtc(variant) {
    if (!this.stickyAtc) return;
    const stickyBtn = this.stickyAtc.querySelector('.sticky-atc__btn');
    if (!stickyBtn) return;
    if (variant.available) {
      stickyBtn.disabled = false;
      stickyBtn.textContent = this.getTranslation('add_to_cart', 'Ajouter au panier');
    } else {
      stickyBtn.disabled = true;
      stickyBtn.textContent = this.getTranslation('sold_out', 'Rupture de stock');
    }
  }

  /* ---- Helpers ---- */
  formatMoney(cents) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: window.Shopify ? (window.Shopify.currency || 'EUR') : 'EUR',
      minimumFractionDigits: 2
    }).format(cents / 100);
  }
}

/* ============================================
   Init
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('product-form');
  if (form) {
    window.productForm = new ProductForm(form);
  }
});
