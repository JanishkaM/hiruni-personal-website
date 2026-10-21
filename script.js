// Wait for every rendered image, including its decoded pixels. Errors settle too.
async function loadPortfolioImages() {
  const loader = document.querySelector('#page-loader');
  const content = document.querySelector('#site-content');
  const images = Array.from(document.images);
  const progress = document.querySelector('#loader-progress');
  const percent = document.querySelector('#loader-percent');
  if (document.documentElement.classList.contains('is-loading')) content.inert = true;
  let settled = 0;
  const updateProgress = () => {
    const value = images.length ? Math.round(settled / images.length * 100) : 100;
    progress.style.width = `${value}%`;
    percent.textContent = `${value}%`;
  };
  const waitForImage = async (image) => {
    if (!image.complete) {
      await new Promise((resolve) => {
        const done = () => {
          image.removeEventListener('load', done);
          image.removeEventListener('error', done);
          resolve();
        };
        image.addEventListener('load', done);
        image.addEventListener('error', done);
        if (image.complete) done();
      });
    }
    if (image.naturalWidth && image.decode) {
      try { await image.decode(); } catch { /* A failed image must not block the page. */ }
    }
    settled += 1;
    updateProgress();
  };
  updateProgress();
  await Promise.all(images.map(waitForImage));
  clearTimeout(window.portfolioLoadingFallback);
  // Let the completed indicator paint before a short, gentle exit.
  requestAnimationFrame(() => {
    loader.classList.add('is-finished');
    setTimeout(() => {
      document.documentElement.classList.remove('is-loading');
      content.inert = false;
      loader.hidden = true;
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240);
  });
}
loadPortfolioImages();

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.querySelector('span').textContent = '+';
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
  menuButton.querySelector('span').textContent = open ? '−' : '+';
});
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.header')) closeMenu();
});
window.matchMedia('(min-width: 561px)').addEventListener('change', closeMenu);
document.querySelector('#year').textContent = new Date().getFullYear();

// Content remains visible without JavaScript or when reduced motion is requested.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !motionPreference.matches) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.section-heading, .about-copy, .project, .ventures-grid article, .leadership-list article, .skills-grid > div').forEach((element) => {
    // Never conceal content already in view or linked directly from another page.
    if (element.getBoundingClientRect().top < window.innerHeight) return;
    element.classList.add('reveal-pending');
    revealObserver.observe(element);
  });
  motionPreference.addEventListener('change', (event) => {
    if (!event.matches) return;
    revealObserver.disconnect();
    document.querySelectorAll('.reveal-pending').forEach((element) => element.classList.remove('reveal-pending'));
  });
  document.addEventListener('focusin', (event) => {
    const section = event.target.closest('.reveal-pending');
    if (section) section.classList.add('is-visible');
  });
}
