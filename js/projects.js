// ── Projects Module ──
// Reads from COMPLETED_PROJECTS and ONGOING_PROJECTS globals (loaded via script tags).
// To add a new project: edit data/projects/completed.js or ongoing.js only.
// To add a map pin: add mapsUrl to the project, then run: python3 scripts/resolve-maps.py



// Convert arrays to id-keyed maps for O(1) modal lookup
let completedProjects = {};
let ongoingProjects = {};

// ── Card Renderers ──

function renderCompletedCards() {
  const grid = document.getElementById('completedProjectsGrid');
  grid.innerHTML = Object.entries(completedProjects).map(([id, p]) => `
    <div class="project-card" onclick="openCompletedModal('${id}')">
      <img src="${p.dataDir}/building.png" alt="${p.name}" class="project-card-img" />
      <div class="project-card-cta"><button class="project-card-cta-btn">View Details →</button></div>
      <div class="project-card-overlay">
        <div class="project-tag">${p.tag}</div>
        <h3>${p.name}</h3>
        <div class="project-card-loc">📍 ${p.shortLoc}</div>
      </div>
    </div>
  `).join('');
}

function renderOngoingCards() {
  const grid = document.getElementById('ongoingProjectsGrid');
  grid.innerHTML = Object.entries(ongoingProjects).map(([id, p]) => `
    <div class="project-card" onclick="openOngoingModal('${id}')">
      <img src="${p.thumbnail}" alt="${p.name}" class="project-card-img" />
      <div class="project-card-cta"><button class="project-card-cta-btn">View Details →</button></div>
      <div class="project-card-overlay">
        <div class="project-tag">Ongoing · ${p.tag}</div>
        <h3>${p.name}</h3>
        <div class="project-card-loc">📍 ${p.shortLoc}</div>
        <a href="#" class="project-card-download"
          onclick="event.stopPropagation(); downloadPdf('${p.pdf}', '${p.name}')">📄 Brochure</a>
      </div>
    </div>
  `).join('');
}

// ── Shared Helpers ──

function brochureName(projectName) {
  return `${projectName}-brochure.pdf`;
}

function downloadPdf(pdfUrl, projectName) {
  const filename = brochureName(projectName);
  fetch(pdfUrl)
    .then(res => res.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    })
    .catch(() => {
      // Fallback: direct link with download attribute
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = filename;
      a.click();
    });
}

function buildImageViewer(images, altPrefix) {
  return images.map((src, i) =>
    `<img src="${src}" alt="${altPrefix} ${i + 1}" />`
  ).join('');
}

// ── Image Viewer with Pan & Zoom ──
// Uses native scroll for panning + page navigation.
// Zoom works by changing image width (layout-based, not CSS transform).

class ImageViewer {
  constructor(container) {
    this.container = container;
    this.scale = 1;
    this.minScale = 1;
    this.maxScale = 5;
    this.wrapper = null;
    this.toolbar = null;
    this.images = [];
    this.initialPinchDist = 0;
    this.initialPinchScale = 1;
    this.lastTap = 0;
    this._boundHandlers = {};
    this.init();
  }

  init() {
    const imgs = Array.from(this.container.querySelectorAll('img'));
    if (!imgs.length) return;

    // Toolbar
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'iv-toolbar';
    this.toolbar.innerHTML = `
      <button class="iv-btn" data-action="zoom-in" title="Zoom in">＋</button>
      <span class="iv-zoom-level">100%</span>
      <button class="iv-btn" data-action="zoom-out" title="Zoom out">−</button>
      <button class="iv-btn" data-action="reset" title="Reset">↻</button>
    `;
    this.container.prepend(this.toolbar);

    // Scrollable wrapper
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'iv-wrapper';
    imgs.forEach(img => this.wrapper.appendChild(img));
    this.container.appendChild(this.wrapper);

    this.zoomLabel = this.toolbar.querySelector('.iv-zoom-level');
    this.images = this.wrapper.querySelectorAll('img');

    // ── Toolbar buttons ──
    this.toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      e.stopPropagation();
      const action = btn.dataset.action;
      if (action === 'zoom-in') this.zoomBy(0.5);
      else if (action === 'zoom-out') this.zoomBy(-0.5);
      else if (action === 'reset') this.resetView();
    });

    // ── Mouse wheel zoom ──
    this.wrapper.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        this.zoomAt(this.scale + delta, e.clientX, e.clientY);
      }
      // If Ctrl/Cmd is not held, allow native vertical scrolling
    }, { passive: false });

    // ── Double-click to toggle zoom ──
    this.wrapper.addEventListener('dblclick', (e) => {
      e.preventDefault();
      if (this.scale > 1.1) {
        this.resetView();
      } else {
        this.zoomAt(2.5, e.clientX, e.clientY);
      }
    });

    // ── Touch: pinch-to-zoom + double-tap ──
    this.wrapper.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.wrapper.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.wrapper.addEventListener('touchend', (e) => this.onTouchEnd(e));
  }

  // ── Touch handlers ──

  onTouchStart(e) {
    if (e.touches.length === 2) {
      // Pinch start — prevent native zoom
      e.preventDefault();
      this.initialPinchDist = this.getTouchDist(e.touches);
      this.initialPinchScale = this.scale;
    } else if (e.touches.length === 1) {
      // Double-tap detection
      const now = Date.now();
      if (now - this.lastTap < 300) {
        e.preventDefault();
        const t = e.touches[0];
        if (this.scale > 1.1) this.resetView();
        else this.zoomAt(2.5, t.clientX, t.clientY);
        this.lastTap = 0;
        return;
      }
      this.lastTap = now;
      // Single-finger: let native scroll handle panning
    }
  }

  onTouchMove(e) {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const dist = this.getTouchDist(e.touches);
      const newScale = this.initialPinchScale * (dist / this.initialPinchDist);
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      this.zoomAt(newScale, cx, cy);
    }
    // Single-finger: native scroll handles it
  }

  onTouchEnd(e) {
    if (e.touches.length < 2) {
      this.initialPinchDist = 0;
    }
  }

  getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ── Zoom methods ──

  zoomBy(delta) {
    const rect = this.wrapper.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    this.zoomAt(this.scale + delta, cx, cy);
  }

  zoomAt(newScale, cx, cy) {
    newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));
    if (Math.abs(newScale - this.scale) < 0.01) return;

    const w = this.wrapper;
    const rect = w.getBoundingClientRect();

    // Point in viewport relative to wrapper visible area
    const viewX = cx - rect.left;
    const viewY = cy - rect.top;

    // That point's position in content-coordinate space
    const contentX = (w.scrollLeft + viewX) / this.scale;
    const contentY = (w.scrollTop + viewY) / this.scale;

    // Apply new scale
    this.scale = newScale;
    this.applyScale();

    // Scroll so the same content point stays under the cursor
    w.scrollLeft = contentX * this.scale - viewX;
    w.scrollTop = contentY * this.scale - viewY;
  }

  applyScale() {
    const pct = (this.scale * 100) + '%';
    this.images.forEach(img => {
      img.style.width = pct;
      img.style.maxWidth = 'none';
    });
    this.zoomLabel.textContent = Math.round(this.scale * 100) + '%';
  }

  resetView() {
    this.scale = 1;
    this.images.forEach(img => {
      img.style.width = '100%';
      img.style.maxWidth = '100%';
    });
    this.wrapper.scrollLeft = 0;
    this.wrapper.scrollTop = 0;
    this.zoomLabel.textContent = '100%';
  }
}

// Track active viewer instances
let activeViewers = [];

function initViewers(container) {
  activeViewers = [];
  container.querySelectorAll('.img-viewer').forEach(el => {
    // Clean up any old toolbar/wrapper from previous opens
    el.querySelectorAll('.iv-toolbar, .iv-wrapper').forEach(old => old.remove());
    if (el.querySelectorAll('img').length === 0) return;
    activeViewers.push(new ImageViewer(el));
  });
}

function toggleZoom(img) {
  // Legacy fallback — no longer used
  img.classList.toggle('zoomed');
}

function buildSpecList(specs) {
  return specs.map(([label, val]) =>
    `<li><span>${label}:</span><strong>${val}</strong></li>`
  ).join('');
}

function resetModalTabs(modal) {
  modal.querySelectorAll('.comp-modal-tab').forEach((t, i) => t.classList.toggle('active', i === 0));
  modal.querySelectorAll('.comp-modal-panel').forEach((p, i) => p.classList.toggle('active', i === 0));
}

// ── Completed Modal ──

function openCompletedModal(id) {
  const p = completedProjects[id];
  if (!p) return;

  document.getElementById('compModalName').textContent = p.name;
  document.getElementById('compModalMotto').textContent = p.motto;
  document.getElementById('compModalDesc').textContent = p.desc;
  document.getElementById('compModalSpecs').innerHTML = buildSpecList(p.specs);
  document.getElementById('compFloorplanViewer').innerHTML = buildImageViewer(p.floorplan, `${p.name} Floor Plan`);
  document.getElementById('compBrochureViewer').innerHTML = buildImageViewer(p.brochure, `${p.name} Brochure Page`);
  document.getElementById('compMapFrame').src =
    (typeof MAPS_EMBEDS !== 'undefined' && MAPS_EMBEDS[id]) ||
    p.mapsEmbed || `https://maps.google.com/maps?q=${p.mapsQuery}&output=embed&z=15`;
  const compPdfBtn = document.getElementById('compModalPdfBtn');
  compPdfBtn.href = '#';
  compPdfBtn.onclick = (e) => { e.preventDefault(); downloadPdf(p.pdf, p.name); };
  document.getElementById('compModalMapsBtn').href =
    p.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${p.mapsQuery}`;

  const waMsg = encodeURIComponent(
    `*Enquiry – ${p.name}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🏢 *Project:* ${p.name}\n` +
    `📍 *Location:* ${p.location}\n` +
    `✅ *Status:* Completed Project\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Hi, I came across your completed project *${p.name}* at ${p.location} on your website. ` +
    `I'm interested in a similar project. Please get in touch.\n` +
    `_Sent from ${window.APP_CONFIG.SITE_DOMAIN}_`
  );
  document.getElementById('compModalWaBtn').href = `https://wa.me/${window.APP_CONFIG.WHATSAPP_NUMBER}?text=${waMsg}`;

  const modal = document.getElementById('completedModal');
  resetModalTabs(modal);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => initViewers(modal));
}

function closeCompletedModal() {
  document.getElementById('completedModal').classList.remove('active');
  document.getElementById('compMapFrame').src = '';
  document.body.style.overflow = 'auto';
}

function switchCompTab(tab, btn) {
  const modal = document.getElementById('completedModal');
  modal.querySelectorAll('.comp-modal-tab').forEach(t => t.classList.remove('active'));
  modal.querySelectorAll('.comp-modal-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const panelMap = {
    floorplan: 'compPanelFloorplan',
    brochure:  'compPanelBrochure',
    location:  'compPanelLocation'
  };
  document.getElementById(panelMap[tab]).classList.add('active');
}

// ── Ongoing Modal ──

function openOngoingModal(id) {
  const p = ongoingProjects[id];
  if (!p) return;

  document.getElementById('ongoingModalName').textContent = p.name;
  document.getElementById('ongoingModalMotto').textContent = p.motto;
  document.getElementById('ongoingModalProgressPct').textContent = p.progress.percent + '% COMPLETE';
  document.getElementById('ongoingModalProgressFill').style.width = p.progress.percent + '%';
  document.getElementById('ongoingModalProgressNote').textContent = p.progress.note;
  document.getElementById('ongoingModalSpecs').innerHTML = buildSpecList(p.specs);
  document.getElementById('ongoingFloorplanViewer').innerHTML = buildImageViewer(p.floorplan, `${p.name} Floor Plan`);
  document.getElementById('ongoingBrochureViewer').innerHTML = buildImageViewer(p.brochure, `${p.name} Brochure Page`);
  document.getElementById('ongoingMapFrame').src =
    (typeof MAPS_EMBEDS !== 'undefined' && MAPS_EMBEDS[id]) ||
    p.mapsEmbed || `https://maps.google.com/maps?q=${p.mapsQuery}&output=embed&z=15`;
  const ongoingPdfBtn = document.getElementById('ongoingModalPdfBtn');
  ongoingPdfBtn.href = '#';
  ongoingPdfBtn.onclick = (e) => { e.preventDefault(); downloadPdf(p.pdf, p.name); };
  document.getElementById('ongoingModalMapsBtn').href =
    p.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${p.mapsQuery}`;

  const waMsg = encodeURIComponent(
    `*Site Visit Request – ${p.name}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🏢 *Project:* ${p.name}\n` +
    `📍 *Location:* ${p.location}\n` +
    `🔄 *Status:* ${p.progress.percent}% Complete – ${p.progress.label}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Hi, I am interested in ${p.name} and would like to book a site visit. ` +
    `Please share available slots and pricing details.\n` +
    `_Sent from ${window.APP_CONFIG.SITE_DOMAIN}_`
  );
  document.getElementById('ongoingModalWaBtn').href = `https://wa.me/${window.APP_CONFIG.WHATSAPP_NUMBER}?text=${waMsg}`;

  const modal = document.getElementById('ongoingModal');
  resetModalTabs(modal);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => initViewers(modal));
}

function closeOngoingModal() {
  document.getElementById('ongoingModal').classList.remove('active');
  document.getElementById('ongoingMapFrame').src = '';
  document.body.style.overflow = 'auto';
}

function switchOngoingTab(tab, btn) {
  const modal = document.getElementById('ongoingModal');
  modal.querySelectorAll('.comp-modal-tab').forEach(t => t.classList.remove('active'));
  modal.querySelectorAll('.comp-modal-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const panelMap = {
    floorplan: 'ongoingPanelFloorplan',
    brochure:  'ongoingPanelBrochure',
    location:  'ongoingPanelLocation'
  };
  document.getElementById(panelMap[tab]).classList.add('active');
}

// ── Image Zoom ──

function toggleZoom(img) {
  img.classList.toggle('zoomed');
  img.parentElement.style.overflowX = img.classList.contains('zoomed') ? 'auto' : 'hidden';
}

// ── Progress Bar Animation ──

function initProgressObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.width =
          entry.target.getAttribute('style').match(/width:([^%]+%)/)?.[1] || '0%';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.progress-fill').forEach(el => observer.observe(el));
}

// ── Init ──

document.addEventListener('DOMContentLoaded', () => {
  // Build id-keyed maps from the globally loaded arrays
  completedProjects = Object.fromEntries(COMPLETED_PROJECTS.map(p => [p.id, p]));
  ongoingProjects   = Object.fromEntries(ONGOING_PROJECTS.map(p => [p.id, p]));

  renderCompletedCards();
  renderOngoingCards();
  initProgressObserver();

  // Modal backdrop close
  document.getElementById('completedModal').addEventListener('click', function (e) {
    if (e.target === this) closeCompletedModal();
  });
  document.getElementById('ongoingModal').addEventListener('click', function (e) {
    if (e.target === this) closeOngoingModal();
  });
});
