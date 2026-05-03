/**
 * global.js — ActiveEdge Theme
 * StickyHeader, MobileMenu, Accordion, overlay coordination
 */

'use strict';

/* ============================================
   Utility: Debounce
   ============================================ */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ============================================
   Utility: Trap Focus
   ============================================ */
function trapFocus(element) {
  const focusable = element.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handleKey(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  element.addEventListener('keydown', handleKey);
  element._trapFocusHandler = handleKey;
}

function removeTrapFocus(element) {
  if (element._trapFocusHandler) {
    element.removeEventListener('keydown', element._trapFocusHandler);
    delete element._trapFocusHandler;
  }
}

/* ============================================
   Overlay Manager
   ============================================ */
const Overlay = {
  element: null,
  callbacks: [],

  init() {
    this.element = document.getElementById('overlay');
    if (!this.element) return;
    this.element.addEventListener('click', () => this.close());
  },

  open(callback) {
    if (!this.element) return;
    this.callbacks.push(callback);
    this.element.classList.add('active');
    this.element.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
  },

  close() {
    if (!this.element) return;
    this.element.classList.remove('active');
    this.element.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    this.callbacks.forEach(cb => cb && cb());
    this.callbacks = [];
  }
};

/* ============================================
   StickyHeader
   ============================================ */
class StickyHeader {
  constructor(el) {
    this.el = el;
    this.lastScrollY = 0;
    this.threshold = 80;
    this.init();
  }

  init() {
    this.onScroll = debounce(this.handleScroll.bind(this), 10);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.handleScroll();
  }

  handleScroll() {
    const scrollY = window.scrollY;
    if (scrollY > this.threshold) {
      this.el.classList.add('scrolled');
    } else {
      this.el.classList.remove('scrolled');
    }
    this.lastScrollY = scrollY;
  }
}

/* ============================================
   MobileMenu
   ============================================ */
class MobileMenu {
  constructor() {
    this.nav = document.getElementById('mobile-nav');
    this.openBtn = document.getElementById('mobile-menu-btn');
    this.closeBtn = document.getElementById('mobile-nav-close');
    this.isOpen = false;

    if (!this.nav || !this.openBtn) return;
    this.init();
  }

  init() {
    this.openBtn.addEventListener('click', () => this.open());
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.nav.classList.add('active');
    this.nav.removeAttribute('aria-hidden');
    this.openBtn.setAttribute('aria-expanded', 'true');
    trapFocus(this.nav);
    Overlay.open(() => this.close());
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.nav.classList.remove('active');
    this.nav.setAttribute('aria-hidden', 'true');
    this.openBtn.setAttribute('aria-expanded', 'false');
    removeTrapFocus(this.nav);
    this.openBtn.focus();
  }
}

/* ============================================
   SearchBar
   ============================================ */
class SearchBar {
  constructor() {
    this.bar = document.getElementById('search-bar');
    this.toggleBtn = document.getElementById('search-toggle');
    this.closeBtn = document.getElementById('search-close');
    this.input = document.getElementById('predictive-search-input');
    this.isOpen = false;

    if (!this.bar || !this.toggleBtn) return;
    this.init();
  }

  init() {
    this.toggleBtn.addEventListener('click', () => this.toggle());
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.close();
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;
    this.bar.classList.add('active');
    this.bar.removeAttribute('aria-hidden');
    this.toggleBtn.setAttribute('aria-expanded', 'true');
    if (this.input) {
      setTimeout(() => this.input.focus(), 100);
    }
  }

  close() {
    this.isOpen = false;
    this.bar.classList.remove('active');
    this.bar.setAttribute('aria-hidden', 'true');
    this.toggleBtn.setAttribute('aria-expanded', 'false');
    this.toggleBtn.focus();
  }
}

/* ============================================
   Accordion (details/summary native)
   ============================================ */
class Accordion {
  constructor(container) {
    this.container = container;
    this.details = container.querySelectorAll('details.accordion');
    if (!this.details.length) return;
    this.init();
  }

  init() {
    this.details.forEach(detail => {
      detail.addEventListener('toggle', () => {
        if (detail.open) {
          // Optionally close others
          // this.closeOthers(detail);
        }
      });
    });
  }

  closeOthers(current) {
    this.details.forEach(detail => {
      if (detail !== current && detail.open) {
        detail.removeAttribute('open');
      }
    });
  }
}

/* ============================================
   Nav Dropdown (desktop)
   ============================================ */
class NavDropdown {
  constructor() {
    this.items = document.querySelectorAll('.header__nav-item--dropdown');
    if (!this.items.length) return;
    this.init();
  }

  init() {
    this.items.forEach(item => {
      const btn = item.querySelector('.header__nav-link--parent');
      const dropdown = item.querySelector('.header__dropdown');
      if (!btn || !dropdown) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        this.closeAll();
        if (!isOpen) {
          btn.setAttribute('aria-expanded', 'true');
          dropdown.style.display = '';
        }
      });

      item.addEventListener('mouseleave', () => {
        btn.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', () => this.closeAll());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeAll();
    });
  }

  closeAll() {
    this.items.forEach(item => {
      const btn = item.querySelector('.header__nav-link--parent');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }
}

/* ============================================
   Cart Count Bump Animation
   ============================================ */
function bumpCartCount(count) {
  const el = document.getElementById('cart-count');
  if (!el) return;

  el.textContent = count;
  if (count > 0) {
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }

  el.classList.add('bump');
  el.addEventListener('animationend', () => el.classList.remove('bump'), { once: true });
}

/* ============================================
   Init on DOM Ready
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  Overlay.init();

  const header = document.getElementById('site-header');
  if (header) new StickyHeader(header);

  new MobileMenu();
  new SearchBar();
  new NavDropdown();

  // Init accordions on product pages
  const productAccordions = document.querySelector('.product-accordions');
  if (productAccordions) new Accordion(productAccordions);

  // Generic accordions
  const genericAccordions = document.querySelectorAll('[data-accordion]');
  genericAccordions.forEach(el => new Accordion(el));
});

/* ============================================
   Cart:updated event listener
   ============================================ */
document.addEventListener('cart:updated', (e) => {
  if (e.detail && typeof e.detail.item_count === 'number') {
    bumpCartCount(e.detail.item_count);
  }
});

/* ============================================
   Expose utilities globally
   ============================================ */
window.ActiveEdge = window.ActiveEdge || {};
window.ActiveEdge.Overlay = Overlay;
window.ActiveEdge.bumpCartCount = bumpCartCount;
window.ActiveEdge.trapFocus = trapFocus;
window.ActiveEdge.removeTrapFocus = removeTrapFocus;
