// ── App Module ──
// Handles: scroll reveal, nav shrink, quote form, PDF.js viewer

// ── PDF.js Setup ──




pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const pdfState = {};

async function loadPdfViewer(id, url) {
  pdfState[id] = { pdf: null, page: 1, total: 0, rendering: false };

  const loading = document.getElementById(id + 'PdfLoading');
  const wrap = document.getElementById(id + 'PdfCanvasWrap');
  const controls = document.getElementById(id + 'PdfControls');

  if (loading) loading.style.display = 'flex';
  if (wrap) wrap.style.display = 'none';
  if (controls) controls.style.display = 'none';

  try {
    const pdf = await pdfjsLib.getDocument(url).promise;
    pdfState[id].pdf = pdf;
    pdfState[id].total = pdf.numPages;

    if (loading) loading.style.display = 'none';
    if (wrap) wrap.style.display = 'flex';
    if (controls) controls.style.display = 'flex';

    await renderPdfPage(id, 1);
  } catch (e) {
    if (loading) loading.textContent = 'Unable to load PDF. Use the Download button below.';
    console.error('PDF load error:', e);
  }
}

async function renderPdfPage(id, pageNum) {
  const state = pdfState[id];
  if (!state || !state.pdf || state.rendering) return;
  state.rendering = true;

  const canvas = document.getElementById(id + 'PdfCanvas');
  const ctx = canvas.getContext('2d');
  const info = document.getElementById(id + 'PdfPageInfo');
  const prev = document.getElementById(id + 'PdfPrev');
  const next = document.getElementById(id + 'PdfNext');

  const page = await state.pdf.getPage(pageNum);
  const wrap = document.getElementById(id + 'PdfCanvasWrap');
  const scale = Math.min((wrap.clientWidth - 24) / page.getViewport({ scale: 1 }).width, 2.2);
  const vp = page.getViewport({ scale });

  canvas.width = vp.width;
  canvas.height = vp.height;

  await page.render({ canvasContext: ctx, viewport: vp }).promise;

  state.page = pageNum;
  state.rendering = false;

  if (info) info.textContent = `Page ${pageNum} of ${state.total}`;
  if (prev) prev.disabled = pageNum <= 1;
  if (next) next.disabled = pageNum >= state.total;
}

function pdfChangePage(id, delta) {
  const state = pdfState[id];
  if (!state || !state.pdf) return;
  const next = state.page + delta;
  if (next < 1 || next > state.total) return;
  renderPdfPage(id, next);
}

// ── Quote Form ──

function submitQuote() {
  const name     = document.getElementById('q-name').value.trim();
  const phone    = document.getElementById('q-phone').value.trim();
  const email    = document.getElementById('q-email').value.trim();
  const type     = document.getElementById('q-type').value;
  const budget   = document.getElementById('q-budget').value;
  const location = document.getElementById('q-location').value.trim();
  const desc     = document.getElementById('q-desc').value.trim();

  if (!name || !phone) {
    alert('Please enter at least your Name and Phone number.');
    return;
  }

  let msg = `*New Quote Request – Meghana Manoj Constructions*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `👤 *Name:* ${name}\n`;
  msg += `📱 *Phone:* ${phone}\n`;
  if (email)    msg += `📧 *Email:* ${email}\n`;
  if (type)     msg += `🏗️ *Project Type:* ${type}\n`;
  if (budget)   msg += `💰 *Budget:* ${budget}\n`;
  if (location) msg += `📍 *Location:* ${location}\n`;
  if (desc)     msg += `📝 *Details:* ${desc}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `_Sent from ${window.APP_CONFIG.SITE_DOMAIN}_`;

  window.open(`https://wa.me/${window.APP_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── Projects Filmstrip Nav ──

document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('completedProjectsGrid');
  const prev = document.getElementById('projectsPrev');
  const next = document.getElementById('projectsNext');
  if (!track || !prev || !next) return;

  const scrollByCard = (dir) => {
    const card = track.querySelector('.project-card');
    const amount = card ? card.getBoundingClientRect().width + 24 : 340;
    track.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  prev.addEventListener('click', () => scrollByCard(-1));
  next.addEventListener('click', () => scrollByCard(1));
});

// ── Services Accordion ──

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.service-row').forEach(row => {
    row.addEventListener('click', () => {
      const panel = document.getElementById(row.dataset.target);
      if (!panel) return;
      const isOpen = row.getAttribute('aria-expanded') === 'true';
      row.setAttribute('aria-expanded', String(!isOpen));
      panel.style.maxHeight = isOpen ? '0px' : panel.scrollHeight + 'px';
    });
  });
});

// ── Hero 3D Depth ──
// Mouse-tracked perspective parallax on the hero photo layer, plus a
// scroll-linked "camera pull-back" as the hero scrolls out of view —
// independent of the Ken Burns zoom already running on the inner photo.

(function () {
  const heroSection = document.getElementById('home');
  const photoWrap = document.getElementById('heroPhotoWrap');
  if (!heroSection || !photoWrap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  let targetScroll = 0, curScroll = 0;

  heroSection.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });

  heroSection.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
  });

  window.addEventListener('scroll', () => {
    const heroHeight = heroSection.offsetHeight || window.innerHeight;
    targetScroll = Math.min(Math.max(window.scrollY / heroHeight, 0), 1);
  }, { passive: true });

  function loop() {
    curX += (targetX - curX) * 0.06;
    curY += (targetY - curY) * 0.06;
    curScroll += (targetScroll - curScroll) * 0.08;

    const rotateY = curX * 4;
    const rotateX = -curY * 4;
    const translateX = curX * -16;
    const translateY = curY * -12 - curScroll * 50;
    const scale = 1 + curScroll * 0.1;

    photoWrap.style.transform =
      `translate3d(${translateX.toFixed(1)}px, ${translateY.toFixed(1)}px, 0) ` +
      `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

// ── Hero Wordmark Build ──
// The hero worker hammers "MEGHANA MANOJ" into place letter by letter, then
// leans in beside it with a thumbs-up once the wordmark finishes building.

(function () {
  const wordmark = document.getElementById('heroWordmark');
  const figure = document.querySelector('svg.hero-worker');
  const scene = document.querySelector('.hero-build-scene');
  if (!wordmark || !figure || !scene) return;

  const TEXT = 'MEGHANA MANOJ';
  const LETTER_DELAY_MS = 90;
  const LETTER_START_MS = 1700; // after the worker's own entrance animation
  const LETTER_DURATION_MS = 420;

  TEXT.split('').forEach((ch, i) => {
    const span = document.createElement('span');
    span.className = 'hero-letter';
    if (ch === ' ') span.classList.add('hero-letter-space');
    span.textContent = ch === ' ' ? ' ' : ch;
    span.style.animationDelay = (LETTER_START_MS + i * LETTER_DELAY_MS) + 'ms';
    wordmark.appendChild(span);
  });

  // The worker keeps hammering (~6 swings, 0.5s each, from 1.4s → ~4.4s) a beat
  // past the wordmark finishing, watching the text, then turns to lean + thumbs-up.
  const HAMMER_END_MS = 1400 + 6 * 500;
  const buildEndMs = LETTER_START_MS + (TEXT.length - 1) * LETTER_DELAY_MS + LETTER_DURATION_MS;
  const celebrateAtMs = Math.max(HAMMER_END_MS, buildEndMs) + 250;

  // CSS keeps the scene paused until `.is-building` lands, so the sequence
  // starts when it's actually on screen. On mobile the scene flows below the
  // hero copy and can sit under the fold, where a load-time timer would run
  // (and finish) before the visitor ever scrolled to it.
  function start() {
    scene.classList.add('is-building');
    window.setTimeout(() => {
      figure.classList.add('lw-celebrate');
    }, celebrateAtMs);
  }

  if (!('IntersectionObserver' in window)) {
    start();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      start();
    });
  }, { threshold: 0.35 });

  observer.observe(scene);
})();

// ── Mouse-Tracked 3D Tilt ──
// Event-delegated on document so it works even on cards rendered later
// (e.g. project cards, injected by projects.js after this script runs).

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const TILT_SELECTOR = '.project-card, .pillar-panel, .testimonial-card, .value-item, .service-row-thumb';
  const TILT_MAX = {
    'project-card': 7,
    'pillar-panel': 3.5,
    'testimonial-card': 5,
    'value-item': 6,
    'service-row-thumb': 10
  };

  let activeEl = null;
  let raf = null;

  function maxFor(el) {
    for (const cls in TILT_MAX) {
      if (el.classList.contains(cls)) return TILT_MAX[cls];
    }
    return 5;
  }

  function applyTilt(el, clientX, clientY) {
    const rect = el.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width - 0.5;
    const y = (clientY - rect.top) / rect.height - 0.5;
    const max = maxFor(el);
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      el.style.setProperty('--tilt-x', (-y * max * 2).toFixed(2) + 'deg');
      el.style.setProperty('--tilt-y', (x * max * 2).toFixed(2) + 'deg');
    });
  }

  function resetTilt(el) {
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
  }

  document.addEventListener('mousemove', (e) => {
    const el = e.target.closest(TILT_SELECTOR);
    if (el !== activeEl) {
      if (activeEl) resetTilt(activeEl);
      activeEl = el;
    }
    if (el) applyTilt(el, e.clientX, e.clientY);
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    if (activeEl) resetTilt(activeEl);
    activeEl = null;
  });
})();

// ── Magnetic Buttons ──
// Primary CTAs pull subtly toward the cursor when nearby, springing back on leave.

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MAGNET_SELECTOR = '.btn-primary, .projects-nav-btn';
  const PULL = 0.35;
  let activeEl = null;
  let raf = null;

  document.addEventListener('mousemove', (e) => {
    const el = e.target.closest(MAGNET_SELECTOR);
    if (el !== activeEl) {
      if (activeEl) activeEl.style.transform = '';
      activeEl = el;
    }
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) * PULL;
    const y = (e.clientY - (rect.top + rect.height / 2)) * PULL;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    });
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    if (activeEl) activeEl.style.transform = '';
    activeEl = null;
  });
})();

// ── Fluid Parallax ──
// Subtle, rAF-driven (not scroll-event-driven) so motion stays buttery rather
// than tied 1:1 to raw scroll ticks. Left as a pure additive layer — it never
// touches window scroll position, so native scroll, anchor jumps, keyboard
// navigation and modals are unaffected.

(function () {
  const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
  if (!parallaxEls.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function loop() {
    const vh = window.innerHeight;
    parallaxEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - vh / 2;
      const offset = Math.max(-1, Math.min(1, center / vh)) * -16;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

// ── Scroll Reveal ──

document.addEventListener('DOMContentLoaded', () => {
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach(el => revealObserver.observe(el));

  // Nav scroll shrink
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }
  }, { passive: true });

  // Hamburger menu toggle
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }
});
