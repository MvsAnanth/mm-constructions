// ── Projects Module ──
// Reads from COMPLETED_PROJECTS and ONGOING_PROJECTS globals (loaded via script tags).
// To add a new project: edit data/projects/completed.js or ongoing.js only.
// To add a map pin: add mapsUrl to the project, then run: python3 scripts/resolve-maps.py

const WHATSAPP_NUMBER = '919246184092';
const SITE_DOMAIN = 'meghanamanjoconstructions.com';

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
    `<img src="${src}" alt="${altPrefix} ${i + 1}" onclick="toggleZoom(this)" />`
  ).join('');
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
    `_Sent from ${SITE_DOMAIN}_`
  );
  document.getElementById('compModalWaBtn').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;

  const modal = document.getElementById('completedModal');
  resetModalTabs(modal);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
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
    `_Sent from ${SITE_DOMAIN}_`
  );
  document.getElementById('ongoingModalWaBtn').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;

  const modal = document.getElementById('ongoingModal');
  resetModalTabs(modal);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
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
