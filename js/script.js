// Mobile nav toggle
// The mobile dropdown is built as a clone appended directly to <body> (not
// nested inside .site-header) because Chrome treats a position:sticky
// ancestor as the containing block for position:fixed descendants, which
// collapsed the in-header version's height to ~0 and made it unopenable.
const navToggle = document.getElementById('navToggle');
const header = document.querySelector('.site-header');
const mainNav = document.querySelector('.main-nav');
const headerActions = document.querySelector('.header-actions');

if (navToggle && header && mainNav && headerActions) {
  const panel = document.createElement('div');
  panel.className = 'mobile-menu-panel';

  const navClone = mainNav.cloneNode(true);
  navClone.removeAttribute('id');
  panel.appendChild(navClone);
  panel.appendChild(headerActions.cloneNode(true));
  document.body.appendChild(panel);

  const setMenuOpen = (isOpen) => {
    panel.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (isOpen) {
      panel.style.setProperty('--header-h', header.offsetHeight + 'px');
      document.body.classList.add('nav-locked');
    } else {
      document.body.classList.remove('nav-locked');
    }
  };

  navToggle.addEventListener('click', () => {
    setMenuOpen(!panel.classList.contains('open'));
  });

  panel.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenuOpen(false);
  });

  window.addEventListener('resize', () => {
    if (panel.classList.contains('open')) {
      panel.style.setProperty('--header-h', header.offsetHeight + 'px');
    }
  });
}

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => observer.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('in-view'));
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
