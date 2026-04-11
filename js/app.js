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
  msg += `_Sent from meghanamanjoconstructions.com_`;

  window.open(`https://wa.me/919246184092?text=${encodeURIComponent(msg)}`, '_blank');
}

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
    if (window.scrollY > 60) {
      nav.style.background = 'rgba(61,43,31,0.99)';
      nav.style.height = '64px';
    } else {
      nav.style.background = 'rgba(75,54,33,0.98)';
      nav.style.height = '72px';
    }
  });
});
