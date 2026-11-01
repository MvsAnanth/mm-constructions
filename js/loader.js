// ── Site Loader ──
// Picks one of 4 construction-worker animation variants at random, shows it
// until the page has loaded and a minimum display time has elapsed.

(function () {
  const loader = document.getElementById('site-loader');
  if (!loader) return;

  const scene = document.getElementById('loaderScene');
  const captionEl = document.getElementById('loaderCaption');

  const VARIANTS = [
    { tpl: 'loaderTplHammer', caption: 'Laying the foundation…' },
    { tpl: 'loaderTplDrill', caption: 'Driving it home…' },
    { tpl: 'loaderTplTrowel', caption: 'Building something great…' },
    { tpl: 'loaderTplCrane', caption: 'Raising the structure…' }
  ];

  const variant = VARIANTS[Math.floor(Math.random() * VARIANTS.length)];
  const tpl = document.getElementById(variant.tpl);
  if (tpl && scene) {
    scene.appendChild(tpl.content.cloneNode(true));
  }
  if (captionEl) captionEl.textContent = variant.caption;

  document.documentElement.classList.add('loader-active');

  const MIN_VISIBLE_MS = 1200;
  const HARD_CAP_MS = 6000;
  const start = performance.now();
  let dismissed = false;

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    loader.classList.add('loader-hide');
    document.documentElement.classList.remove('loader-active');
    window.setTimeout(() => {
      loader.setAttribute('aria-hidden', 'true');
      loader.setAttribute('inert', '');
      loader.style.display = 'none';
    }, 550);
  }

  function scheduleDismiss() {
    const elapsed = performance.now() - start;
    window.setTimeout(dismiss, Math.max(0, MIN_VISIBLE_MS - elapsed));
  }

  window.addEventListener('load', scheduleDismiss);
  window.setTimeout(dismiss, HARD_CAP_MS);
})();
