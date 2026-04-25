const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

const modalStylesStart = css.indexOf('/* ── COMPLETED PROJECT MODAL ── */');
const responsiveStart = css.indexOf('/* ── RESPONSIVE ── */');
const scrollAnimationsStart = css.indexOf('/* ── SCROLL ANIMATIONS ── */');

if (modalStylesStart > -1 && responsiveStart > -1 && modalStylesStart > responsiveStart) {
  // Extract modal styles (everything between modalStylesStart and scrollAnimationsStart)
  const modalStyles = css.substring(modalStylesStart, scrollAnimationsStart);
  
  // Remove modal styles from original position
  css = css.substring(0, modalStylesStart) + css.substring(scrollAnimationsStart);
  
  // Insert modal styles before responsive section
  const newResponsiveStart = css.indexOf('/* ── RESPONSIVE ── */'); // recalculate index
  css = css.substring(0, newResponsiveStart) + modalStyles + '\n\n' + css.substring(newResponsiveStart);
  
  fs.writeFileSync('styles.css', css);
  console.log('Successfully reordered CSS: moved modal styles before media queries.');
} else {
  console.log('CSS already ordered correctly or markers not found.');
}
