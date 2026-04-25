window.APP_CONFIG = window.APP_CONFIG || {
  "WHATSAPP_NUMBER": "",
  "SITE_DOMAIN": "",
  "PHONE_DISPLAY": "",
  "PHONE_NUMBER_2": "",
  "PHONE_DISPLAY_2": "",
  "EMAIL": ""
};

function loadConfig() {
  // Config is now loaded synchronously via js/config.js script tag
  updateDOMConfig();
}

function updateDOMConfig() {
  const cfg = window.APP_CONFIG;
  document.querySelectorAll('[data-config="phone-link"]').forEach(el => el.href = `tel:+${cfg.WHATSAPP_NUMBER}`);
  document.querySelectorAll('[data-config="phone-text"]').forEach(el => el.textContent = cfg.PHONE_DISPLAY);
  document.querySelectorAll('[data-config="phone-link-2"]').forEach(el => el.href = `tel:+${cfg.PHONE_NUMBER_2}`);
  document.querySelectorAll('[data-config="phone-text-2"]').forEach(el => el.textContent = cfg.PHONE_DISPLAY_2);
  document.querySelectorAll('[data-config="email-link"]').forEach(el => el.href = `mailto:${cfg.EMAIL}`);
  document.querySelectorAll('[data-config="email-text"]').forEach(el => el.textContent = cfg.EMAIL);
  document.querySelectorAll('[data-config="whatsapp-link"]').forEach(el => {
    const text = el.getAttribute('data-wa-text') || '';
    el.href = `https://wa.me/${cfg.WHATSAPP_NUMBER}${text ? '?text=' + encodeURIComponent(text) : ''}`;
  });
}

document.addEventListener('DOMContentLoaded', loadConfig);
