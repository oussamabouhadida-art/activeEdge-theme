'use strict';

/* ============================================
   Scroll Reveal — IntersectionObserver
   Usage: add data-reveal or data-reveal="fade-up|fade-in|slide-left|slide-right|scale"
   Add data-reveal-delay="100" (ms) for stagger
   ============================================ */
(function () {
  const DEFAULTS = {
    threshold: 0.12,
    rootMargin: '0px 0px -48px 0px',
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = el.dataset.revealDelay || 0;
      setTimeout(() => {
        el.classList.add('is-revealed');
      }, Number(delay));
      io.unobserve(el);
    });
  }, DEFAULTS);

  function initReveal() {
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      el.classList.add('will-reveal', `will-reveal--${el.dataset.reveal || 'fade-up'}`);
      io.observe(el);
    });

    // Auto-stagger children when parent has data-reveal-stagger
    document.querySelectorAll('[data-reveal-stagger]').forEach((parent) => {
      const children = parent.querySelectorAll(parent.dataset.revealStagger || ':scope > *');
      children.forEach((child, i) => {
        child.dataset.reveal = child.dataset.reveal || 'fade-up';
        child.dataset.revealDelay = i * (Number(parent.dataset.revealStep) || 80);
        child.classList.add('will-reveal', `will-reveal--${child.dataset.reveal}`);
        io.observe(child);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
})();

/* ============================================
   Parallax Hero — subtle depth on scroll
   ============================================ */
(function () {
  const hero = document.querySelector('.hero__media');
  if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.25}px)`;
      }
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
})();

/* ============================================
   Number Counter — animates [data-counter]
   ============================================ */
(function () {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.counter);
      const duration = Number(el.dataset.counterDuration) || 1400;
      const decimals = (String(target).split('.')[1] || '').length;
      const start = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
      counterIO.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach((el) => counterIO.observe(el));
})();

/* ============================================
   Magnetic buttons — subtle cursor attraction
   ============================================ */
(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  document.querySelectorAll('.btn--magnetic').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
})();
