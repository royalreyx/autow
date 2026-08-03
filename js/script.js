// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const header = document.querySelector('.site-header');

if (navToggle) {
  const setMenuOpen = (isOpen) => {
    header.classList.toggle('nav-open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (isOpen) {
      document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
      document.body.classList.add('nav-locked');
    } else {
      document.body.classList.remove('nav-locked');
    }
  };

  navToggle.addEventListener('click', () => {
    setMenuOpen(!header.classList.contains('nav-open'));
  });

  document.querySelectorAll('.main-nav a, .header-actions a').forEach(link => {
    link.addEventListener('click', () => setMenuOpen(false));
  });

  window.addEventListener('resize', () => {
    if (header.classList.contains('nav-open')) {
      document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
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
