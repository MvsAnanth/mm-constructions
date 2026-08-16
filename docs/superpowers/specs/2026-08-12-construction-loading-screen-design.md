# Construction-Themed Loading Screen — Design Spec

**Status:** Implemented
**Date:** 2026-08-12
**Scope:** First sub-project of the broader "3D UI overhaul" request. Implemented alongside a second pass — per-section scroll reveal/hover treatments (see "Per-section animations" below) — at the user's request to see everything live together. Construction-themed nav/scroll behavior remains out of scope / for a future pass.

## Hero 3D depth + scroll storytelling (added same session, sixth pass)

Feedback: the tilt system only touched cards/panels — wanted 3D motion in the hero itself, and the background to "change like in a construction theme, storytelling" while scrolling.

- **Hero layered 3D depth** (`js/app.js`): split `.hero-photo` into an outer `.hero-photo-wrap` (mouse-tracked `rotateX`/`rotateY`/`translate3d` parallax, lerped via `requestAnimationFrame`) and the inner `.hero-photo` (keeps its existing Ken Burns `scale` keyframe animation, untouched). The wrap also gets a scroll-linked "camera pull-back": as the user scrolls past the hero, it scales up slightly and translates, like a camera pulling back through the scene. Two independently-animated layers avoids the same animation/inline-style collision documented above — confirmed necessary by finding out `.hero-content`'s existing `heroFadeIn` entrance animation would have silently eaten a JS-driven transform if applied there too (so a planned secondary counter-parallax on the text was dropped rather than shipped broken).
- **Scroll storytelling seams**: the site's section backgrounds already alternate in a way that loosely narrates a construction project (cream site → dark green "under construction" services → coffee/green/gold materials/pillars → cream showcase → gray progress → gold call-to-action → near-black handover/footer). Added a soft gradient blend (`::after`, `linear-gradient(transparent → next section's color)`) at the base of `#about`, `#services`, `#projects`, `#ongoing`, `#quote`, and `.cta-strip`, each reading a `--seam-color` custom property set to the *next* section's background — so the palette shift reads as a continuous fade while scrolling rather than a hard cut. Pillars section deliberately excluded (its three-panel color-block layout has no single "next color" to seam into cleanly; it already has its own signature striped-bar treatment for visual interest at its edges).

Verified via Playwright: read the actual computed `transform` on `#heroPhotoWrap` before/after moving the mouse (confirmed `rotateX`/`rotateY`/`translate3d` change with cursor position) and before/after scrolling (confirmed `scale`/`translateY` change with scroll position) — not just screenshots, since the earlier tilt bug proved screenshots alone don't catch a transform silently failing to apply. Screenshots confirm the seams render as intended (About→Services fade is clearly visible) with no content obscured. Zero console errors (aside from the pre-existing favicon 404).

## 3D interactive motion (added same session, fifth pass)

After the whole-site redesign, feedback was that it lacked "3D motion animations or fluid interactive elements." Added a real-time mouse-tracked 3D tilt system rather than reverting to literal 3D geometry:

- **Tilt system** (`js/app.js`, event-delegated on `document` so it works on cards rendered later by `projects.js`): on `mousemove`, computes normalized cursor position within the hovered element and writes `--tilt-x`/`--tilt-y` CSS custom properties (perspective rotation degrees), reset on `mouseleave`. Applied to `.project-card`, `.pillar-panel` (continuous, not hover-gated), `.testimonial-card`, `.value-item`, and `.service-row-thumb`.
- **Magnetic buttons**: `.btn-primary` and `.projects-nav-btn` pull toward the cursor within their bounds (`translate()`, capped pull factor) and spring back via the element's existing `transition: transform`. `.nav-cta` and `.wa-float` were deliberately excluded — both already have conflicting `!important`/`@keyframes` transform rules that would fight a JS-driven inline transform.
- Both modules gate on `prefers-reduced-motion: reduce` at init and return early (no listeners attached at all), rather than relying solely on the global CSS animation-duration override.

**Real bug caught and fixed (not a cache issue this time):** initial verification showed the tilt transform computing to an identity matrix despite `:hover` correctly matching and the CSS custom properties being set correctly. Root cause: `.project-card:hover`, `.testimonial-card:hover`, `.value-item:hover` (and `.pillar-panel`'s base rule) have the *same* specificity (0,2,0) as the reveal-system rules that also target these elements (`.reveal-brick.visible > *`, `.reveal-stagger.visible > *`, `.reveal-flip.visible > *`, `.reveal.visible`) — and those reveal rules are declared *later* in the stylesheet, so they won the cascade tie and silently reset `transform` back to their own resting value on every hover, on every card, site-wide. This was a latent bug from the per-section-animations pass earlier in this session, not something introduced by the tilt work — the tilt work just made it observable. Fixed with targeted `!important` on the four affected `transform` declarations (documented inline in the CSS with a comment explaining why, since a bare `!important` with no context is a maintenance trap). Confirmed the fix by reading the actual computed `--tilt-x`/`--tilt-y` values and the resulting `matrix3d(...)` after the fix, not just visually.

Verified via Playwright: tilt on project cards, pillar panels, testimonial cards all confirmed via direct style/computed-style inspection (not just screenshots, since a few degrees of rotation doesn't read reliably in a static image); magnetic button pull confirmed the same way; zero console errors.

## Whole-site redesign (added same session, fourth pass)

"Redo the entire UI similar to modusprojects.nl" — this time actually navigated to the reference site with Playwright and screenshotted the full scroll depth (13 screenshots) rather than relying on a text-only fetch, which had given a generic, unhelpful description. That surfaced the real design system: huge bold two-tone uppercase headlines, alternating light/dark sections, a numbered 3-panel color-block process section with a recurring striped-gradient bar graphic, a dark services list (thumbnail + label + "+" expand), a horizontal project filmstrip carousel, and a giant wordmark footer with the same striped bars.

Translated into the MM Constructions brand (kept coffee/green/gold/cream palette, DM Sans/Cormorant Garamond, and real project photography throughout — did not adopt Modus's own colors or copy):

- **Global typography**: `.section-title` (shared by every section header) changed from a light-weight italic serif accent to bold uppercase DM Sans with a gold `<em>` accent — retheme every section at once from one shared class.
- **New "Statement" section** after the hero: huge centered two-tone headline (dark + muted gray, matching Modus's own two-tone technique) + a short paragraph, on cream background.
- **Services rebuilt** from a 3×2 icon-card grid into Modus's dark list pattern: 64px real-project-photo thumbnail + uppercase name + circular "+" button per row, hairline dividers, click-to-expand description (`js/app.js` accordion, toggles `aria-expanded` + `max-height`). Thumbnails reuse existing real assets (`data/Completed/*/building.png`, `data/Ongoing/manoj-castle/building.png`, the About/Office stock photos already in the project) — no new images introduced.
- **New "Pillars" section**: three color-block panels (coffee/green/gold) numbered 01/02/03, each with a heading + short copy and — at the base — the signature striped-bar graphic (`.pillar-bars`, pure CSS gradient divs at varied heights). This same bar component is reused in the footer, tying the two together as the site's one recurring signature motif (per the frontend-design skill's "spend your boldness in one place" guidance).
- **Completed-projects grid converted to a horizontal filmstrip**: `overflow-x: auto` + `scroll-snap-type: x mandatory` on `.projects-grid`, fixed-width cards, plus simple prev/next buttons (`scrollBy` in `js/app.js`) — a lighter-weight nod to Modus's pinned carousel without rewriting `projects.js`'s render logic. Ongoing-projects grid intentionally left as a normal grid (still transparency-appropriate, avoids scope creep).
- **Footer**: added the striped-bar graphic along the right edge and a full-width bold uppercase wordmark ("Meghana Manoj") at the very bottom, echoing Modus's giant closing logo treatment.

**Pitfall hit and fixed (again):** after implementing, screenshots showed the statement section rendering as tiny default text and the services thumbnails rendering full-width/broken — looked like a CSS syntax error, but it was the same stale-`styles.css`-cache issue as the loader/hero work earlier in this session (`index.html` was cache-busted via a `?v=` query param on navigation, but the linked `styles.css` was requested with the same URL every time). Confirmed by force-reloading the stylesheet with a cache-busting query param — the "broken" render was already correct on disk. Worth remembering: when a CSS change "doesn't seem to apply" in this project's dev loop, check the stylesheet cache before assuming a code bug.

Verified via Playwright at 1440px and 390px: statement section, services accordion (click-to-expand works), pillars, projects filmstrip (prev/next buttons work), footer, and all pre-existing sections (testimonials, quote, contact) — all render correctly, fully responsive, zero console errors.

## Hero: three iterations, retired 3D entirely

The hero went through three treatments in one session before landing:

1. **Three.js wireframe skyline**, then **flat-illustration low-poly skyline** — rejected twice as "just blocks" / not natural. `js/three-scene.js` deleted; `three.js` CDN script removed.
2. **Photo-cluster** — full-bleed restored gradient/photo background (`.hero-bg`/`.hero-pattern`) plus a tilted stack of the company's real project photos (`data/Ongoing/manoj-castle/building.png`, `data/Completed/manoj-heights/building.png`, `data/Completed/manoj-homes-sainikpuri/building.png`) as floating cards, with an SVG "blueprint trace" signature accent. Rejected: "doesn't look like a proper hero section."
3. **Full-bleed editorial photo hero (current)** — rebuilt to directly match the reference the user gave, https://www.modusprojects.nl/ (confirmed via live Playwright screenshot, not just text description): one dramatic full-bleed real photo, no card clusters, no decorative SVG overlays. Specifically:
   - `.hero-photo`: the existing About-section construction photo (`photo-1541888946425-d81bb19240f5`, real site photography already used in the project) as a full-bleed background with a slow Ken Burns zoom (28s ease-in-out infinite alternate, scale 1→1.06).
   - `.hero-scrim`: a bottom-heavy gradient (dark at bottom, fading up) *plus* a uniform ~28% dark wash across the whole frame — needed after the first pass left the eyebrow text low-contrast against a bright patch of the photo near the top.
   - Headline pushed much larger (`clamp(3.4rem, 9vw, 8rem)`, weight 400, line-height 0.98) and the whole content block bottom-anchored (`justify-content: flex-end`) rather than vertically centered — matches Modus's composition of huge type sitting low over the photo with room to breathe above.
   - `.hero-content-foot`: tagline/sub-copy and the CTA buttons sit side-by-side in a bottom row above a thin divider rule, wrapping to a column at ≤900px.
   - `.hero-badge-tab`: small rotated "Est. 2002" tab on the left edge (echoes Modus's award-badge tab), hidden at ≤900px where there's no room.
   - `.hero-scroll-cue`: a small bouncing chevron bottom-left, linking to `#about`.
   - Removed the photo-cluster and blueprint-SVG CSS entirely (`.hero-showcase*`, `.hero-blueprint`, `.hb-*`, `.card-*`, associated keyframes) rather than leaving it dead in the stylesheet.

Verified via Playwright at 1440px, 820px (tablet), and 390px (mobile) — legible text at every size, no console errors, no regressions below the hero.

## Context

MM Constructions (`v2.0` branch) already has an in-progress, uncommitted Three.js hero scene (`js/three-scene.js`) with wireframe buildings, particle dust, mouse-tilt parallax, and scroll-zoom camera, plus a 3D-tilt hover on project cards and a nav scroll-shrink effect. The site has no existing page-load splash screen — this is entirely new.

Brand palette (from `styles.css` `:root`): `--coffee: #3d2b1f`, `--coffee-mid: #4b3621`, `--coffee-light: #6d4c41`, `--green: #1a3a2a`, `--green-mid: #2d5a3f`, `--green-light: #3d7a55`, `--gold: #c9a84c`, `--gold-light: #e8cc7a`, `--cream: #f7f3ec`, `--white`, `--gray`, `--text-dark`, `--text-mid`, `--text-light`.

## Goal

A full-viewport loading screen shown while the page loads, featuring an animated construction worker illustration. On each visit, one of 4 distinct worker/tool animations is chosen at random for visual variety. Style is flat/isometric illustration (solid fills, soft gradients, subtle shadows) in the brand palette — explicitly NOT the wireframe/outline style used in the hero scene, since a loading character needs to read clearly at a glance.

## Structure

- New overlay `#site-loader`, injected as the first child of `<body>` in `index.html`.
- Full viewport (`position: fixed; inset: 0`), `z-index: 9999`, background in brand dark green/coffee so it reads as part of the site.
- Visible by default via CSS (no JS required to show it — avoids flash of unstyled content).
- Contains: the randomly-selected SVG illustration, the company wordmark/logo mark, and a rotating short line of copy (e.g. "Laying the foundation…") in gold-on-dark with 3 pulsing dots.

## The 4 worker illustrations

Each is a self-contained inline `<svg>` (or `<template>`-wrapped SVG) block placed in `index.html`, ~120–180px, flat/isometric style, brand-colored:

1. **Hammer & wall** — worker swings a hammer; a brick block "pops" into the wall on each downstroke (loop).
2. **Drill** — worker drives a power drill into a beam; small gold spark/dust particles puff on a rhythm.
3. **Trowel & bricks** — worker spreads mortar with a trowel motion, a brick slides into place, repeat.
4. **Mini crane** — a small crane arm swings and lowers a steel beam, cable sways with easing.

All 4 SVGs live inline in the HTML (no extra network request, ~2–4KB each). Only the randomly-chosen scene's animation is started; the other 3 remain inert (unrendered template content, not animating in the background).

## Motion

Pure CSS `@keyframes` per scene: arm swing, tool strike, particle puff, beam sway — timed to a natural work cadence (~1–1.4s per loop cycle) — plus a subtle idle bob so the figure never looks frozen. No JS-driven animation loop needed for the artwork itself.

## Lifecycle (`js/loader.js`, new file)

1. On script load (before `DOMContentLoaded` ideally, or very early in `DOMContentLoaded`): pick `Math.floor(Math.random() * 4)`, clone that scene's template into the visible SVG slot, add a class to start its CSS animation.
2. Record `performance.now()` as `startTime`.
3. Listen for `window.addEventListener('load', ...)` (covers images, fonts, three.js/hero scene boot).
4. On `load`, compute `elapsed = performance.now() - startTime`; wait `Math.max(0, 1200 - elapsed)` ms via `setTimeout`, then dismiss.
5. Dismiss: add a `.loader-hide` class that fades `opacity` over ~500ms; after the transition, set `display: none`, `aria-hidden="true"`, and `inert` on the loader; remove the `body` scroll-lock class.
6. While visible, `document.body` gets a scroll-lock class (`overflow: hidden`) to prevent scroll-jank behind the loader; released on dismiss.
7. **Fallback safety:** a `setTimeout` hard cap (e.g. 6s from script start) forces dismissal even if `load` never fires cleanly, so the site can never be permanently blocked by loader JS.

## Accessibility

- Loader root: `role="status" aria-live="polite"`, containing visually-hidden plain text "Loading Meghana Manoj Constructions…" for screen readers.
- `prefers-reduced-motion: reduce`: swap to a static logo mark + a simple fading/pulsing progress indicator (no swinging limbs, no keyframe motion on the illustration).
- If JS fails entirely, the loader still must not permanently block the page — the same CSS `prefers-reduced-motion` fallback path plus the hard-cap timeout in `loader.js` cover this; no `<noscript>` block is needed since the loader is JS-dismissed, not JS-shown.

## Performance

- No new network requests (inline SVG, no external animation library).
- Idle (unselected) scenes are never animated or rendered visibly — no wasted paint work.
- Loader script (`js/loader.js`) is small and dependency-free; loads before other scripts so it can start the minimum-duration timer as early as possible.

## Per-section animations (added same session)

Extended the existing `.reveal`/`.visible` IntersectionObserver system (`js/app.js`) with variant classes, applied per-section in `index.html`, each with its own `@keyframes`/transition in `styles.css`:

- **About** — `.reveal-blueprint`: the image wipes in via `clip-path` on the inner `.about-img` (not the observed wrapper — see pitfall below), badge fades in after.
- **Services / Ongoing / tech-specs / quote-features / contact-items** — `.reveal-stagger`: children scale+translate in with nth-child transition delays.
- **Projects grid** — `.reveal-brick`: cards rise from below with staggered delays, like bricks being laid.
- **Testimonials** — `.reveal-flip`: cards rotate in on the X axis, staggered.
- **Quote form** — `.reveal-crane`: panel drops in from above with an overshoot bounce.
- **Contact office image** — `.reveal-pin`: scales/bounces in.
- Added hover micro-interactions: 3D tilt + icon bounce on `.service-card`, lift + shadow on `.value-item`/`.testimonial-card`, icon nudge on `.contact-icon`.
- Extended the `prefers-reduced-motion` block to neutralize all new variants.

**Pitfall hit and fixed:** initially put the `clip-path` wipe directly on the `.reveal-blueprint` element being observed by the IntersectionObserver. Chromium factors an element's own `clip-path` into its intersection geometry, so a fully-clipped (`inset(0 100% 0 0)`) target reports `intersectionRatio: 0` forever — a deadlock, since the element can only un-clip once it's marked visible, but it's only marked visible once it intersects. Fixed by keeping the observed wrapper unclipped (`opacity/transform: none`) and moving the `clip-path` transition to the inner `.about-img` child instead.

## Out of scope (future sub-projects)

- Construction-themed navigation/scroll motifs (crane cursor, progress bar, etc.).
- Further polish/expansion of the existing Three.js hero scene.
