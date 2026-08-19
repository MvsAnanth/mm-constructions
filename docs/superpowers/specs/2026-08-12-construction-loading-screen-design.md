# Construction-Themed Loading Screen — Design Spec

**Status:** Implemented
**Date:** 2026-08-12
**Scope:** First sub-project of the broader "3D UI overhaul" request. Implemented alongside a second pass — per-section scroll reveal/hover treatments (see "Per-section animations" below) — at the user's request to see everything live together. Construction-themed nav/scroll behavior remains out of scope / for a future pass.

## Hero wordmark-build sequence (eighth pass, relocated from the loader)

First attempt put the "worker hammers → builds the 'MEGHANA MANOJ' wordmark letter by letter → leans against it with a thumbs-up" sequence into the *loading screen*, replacing its 4-randomized-tool-variant system. Follow-up feedback: that sequence belongs in the **hero section**, not the loader — restore the loader to exactly how it was (4 random variants, original `js/loader.js`, all 4 `<template>` blocks back in `index.html`).

- **Loader**: fully reverted via `git checkout HEAD -- js/loader.js` plus manually restoring the original loader markup/templates in `index.html`. Back to picking one of hammer/drill/trowel/crane at random per page load, as it was before this pass.
- **Hero**: the wordmark-build sequence (letter-by-letter `<span>` pop-in + hammer→thumbs-up crossfade + lean) was rebuilt targeting the hero instead. The existing `.hero-worker` SVG (added two passes ago) gained the same `.lw-thumbsup-group` arm used in the loader draft. It and a new `.hero-wordmark-plaque` (a dark, blurred, bordered card holding the building "MEGHANA MANOJ" text) are now grouped in a `.hero-build-scene` flex container — sized once via flexbox rather than juggling independent absolute-position percentages for two elements that need to stay adjacent, which is what made the original hero-worker placement fiddly two passes ago. Sits inside `.hero-photo-wrap` so it still gets the mouse/scroll 3D parallax. Hidden below 900px, matching the existing hero-worker/badge-tab mobile treatment.
- **Timing**: letters start 1.7s in (after the worker's own 1.4s entrance), build over ~1.6s, then the lean/thumbs-up triggers ~200ms later — driven from `js/app.js`, not `js/loader.js` this time.
- **Colors**: the wordmark plaque uses a semi-opaque dark backing (`rgba(8,16,12,0.72)` + blur + border) specifically because the hero photo is busier and less uniformly dark than the loader's background — a text glow alone (as used in the loader) wasn't enough to guarantee contrast against arbitrary photo content underneath, so a dedicated backing card was added for the hero version specifically.

**Cascade-tie sizing bug avoided proactively this time**: applied the `svg.hero-worker` / already-established specificity-bump pattern from the start (rather than discovering it via a broken screenshot again), and confirmed via `getBoundingClientRect()` that the worker rendered at its intended 150×150 immediately.

Verified via Playwright: screenshots + tight crops around the worker's actual bounding box (it's visually subtle against the busy photo at full-page scale, same as the earlier hero-worker — confirmed present and correctly colored via a tight crop rather than assuming from a full-page screenshot); confirmed letters build progressively across two timed screenshots; confirmed the loader is back to its original random-variant behavior; confirmed mobile (390px) hides the whole build scene cleanly; zero console errors.

**Follow-up (ninth pass): visibility fix.** Confirmed correct-but-subtle in the eighth pass turned out to actually be a real problem in practice — a tight crop proves an element *renders*, it doesn't prove a normal visitor would ever notice it sitting on a busy, similarly-toned photo at full scale. Fixed by giving `.hero-build-scene` its own opaque "stage": a dark rounded card wrapping *both* the worker and the wordmark together, replacing the wordmark-only backing plaque from the eighth pass. Also enlarged the worker (150px → 180px), enlarged and brightened the wordmark type, and moved the whole scene from `bottom: 260px` to `bottom: 340px` — up and clear of the cluster of real photographed workers it was previously overlapping, which was very likely the main reason it read as invisible (illustrated figure blending into real figures of similar scale and tone).

**Follow-up (tenth pass): color + a cleaner overlay.** Two more targeted fixes:
1. **Color conflict caught before shipping**: the first attempt at this card used a coffee-brown gradient background — but the worker's own legs are filled with `var(--coffee)`, the *exact same color* as the card's gradient endpoint, which would have made the legs disappear into their own backdrop. Switched the card to the green family (`var(--green-mid)` → `var(--green)` gradient) instead, which the worker's coffee/gold/skin tones all contrast against cleanly (only the vest, a small area already using `--green-mid`, has minor overlap — acceptable since the gold helmet and coffee limbs still clearly define the figure's silhouette).
2. **Cleaner overlay**: dropped the `backdrop-filter: blur()` + translucent-black background from the ninth pass in favor of a fully opaque solid gradient — a hazy blurred panel read as less "clean and neat" than a crisp, fully opaque card with a solid gold border. Wordmark text switched from `--gold-light` to `--cream` (near-white) for maximum contrast against the now-green card, with a subtle plain drop shadow instead of the earlier glow (the glow was compensating for a background that wasn't opaque enough — no longer needed).

Verified via Playwright: full-page screenshots at the loaded/leaning state, a mid-sequence crop confirming the card renders as a clean solid panel *while* the worker is still mid-hammer and the wordmark is only partially built, and a mobile (390px) screenshot confirming the whole scene still hides cleanly with no orphaned styling. Zero console errors.

**Follow-up (eleventh pass): a real stacking bug, and cutting the leftover brick wall.** Feedback: a stray white line was appearing across the card, and the worker looked like it was hammering a separate brick wall rather than the wordmark.

- **The white line was a real bug, not a styling artifact**: `.hero-build-scene` lived inside `.hero-photo-wrap`, which only has `z-index: 0` at the `.hero` level — so *everything* inside it, including the card's own `z-index: 3`, was capped below `.hero-content` (`z-index: 2`) as a sibling, since a descendant's z-index can never escape its ancestor's stacking context. `.hero-content-foot`'s `border-top` divider (meant to sit between the headline and the tagline row) was consequently rendering *on top of* our card wherever the two happened to overlap — that was the "white line." Confirmed via `document.elementFromPoint()` at the line's coordinates, which returned `.hero-content`, not anything inside the build scene. Fixed by moving `.hero-build-scene` out of `.hero-photo-wrap` entirely, to be a direct sibling of `.hero-content` — it no longer gets the photo's mouse/scroll parallax coupling (an acceptable trade-off), but now sits in the correct stacking context and `z-index: 3` actually means what it says.
- **Removed the brick wall**: the worker SVG still carried its `.lw-wall`/`.lw-brick-*` elements from the original loader illustration (a worker hammering bricks into a wall) — visually disconnected from "building the wordmark" and read as random brown blocks next to the figure. Deleted them from the hero copy of the SVG (the loader's own templates are untouched).
- **Lean direction fixed**: the finale pose rotated the figure *away* from the text (`rotate(-7deg)`) rather than toward it, reading as the figure recoiling rather than leaning against something. Changed to `rotate(5deg)` tilting toward the wordmark, so it now reads as leaning its shoulder against the divider beside the text.

Verified via Playwright: re-screenshotted the same crop region and confirmed the white line is gone; confirmed via `getBoundingClientRect` / visual check that the card no longer overlaps the hero headline now that it renders above `.hero-content-foot`'s divider; confirmed the worker's hammer-swing and thumbs-up finale still function correctly at the new DOM position; mobile (390px) still hides the whole scene cleanly; zero console errors.

**Follow-up (twelfth pass): remove the card, tuck the worker onto the "M", and the white line came back for a different reason.** Feedback: no separate box behind the scene at all; the worker should be positioned right at the "M" of "Meghana" (hammering it, then leaning directly on it), not standing apart from the text.

- **Card removed**: `.hero-build-scene` no longer has a background/border/border-radius/box-shadow/padding — it's a plain flex container now. Contrast is instead carried entirely by a stronger `text-shadow` on the wordmark letters (dark shadow + wide gold glow) and a heavier `drop-shadow` filter on the worker SVG, and the type itself got bigger (`clamp(1.6rem,3.2vw,2.3rem)` → `clamp(2rem,4.4vw,3.2rem)`).
- **Worker tucked onto the "M"**: `svg.hero-worker` gets `margin-right: -30px`, pulling it to overlap the leading edge of the wordmark instead of sitting in a separate slot beside it — so the hammer swings right at/into the "M" instead of empty space, and the finale lean (`translateX` bumped 8px → 20px) now visibly rests the figure against that first letter.
- **The white line came back — for a genuinely different reason than the eleventh pass, not a regression of the same fix.** With the opaque card gone, `.hero-content-foot`'s `border-top` divider (which spans the *full* `.hero-content` box — `max-width: 1100px`, sized for the large headline, not for this narrower row) was no longer hidden behind an opaque background, so the portion of it extending past the actual tagline/button content — into the space where the build scene now sits — became visible again through the now-transparent scene. Confirmed with `elementFromPoint` at the *exact* line coordinates this time (the previous pass tested a y-coordinate 19px off, which is why it looked "fixed" in that check but wasn't) and by reading `.hero-content-foot`'s actual `getBoundingClientRect()`, which showed its border extending to `x:1013` — well past the build scene's left edge (`x:747`). Fixed at the source, not by covering it up: gave `.hero-content-foot` its own `max-width: 620px`, comfortably wide enough for `.hero-copy` (480px) and the buttons without wrapping, but short enough that its divider now ends at `x:735`, before the build scene begins. The headline itself (`.hero-content`'s own `max-width: 1100px`) was deliberately left untouched to avoid affecting the large H1 sizing.

Verified via Playwright: confirmed `.hero-content-foot`'s rect right edge (735) no longer reaches the build scene's left edge (747) after the fix; full-page and cropped screenshots at the loaded, mid-build, and post-lean states show no line, no box, and the worker positioned overlapping the "M"; mobile (390px) unaffected by the narrower `.hero-content-foot`; zero console errors.

**Follow-up (thirteenth pass): real two-arm anatomy, and a visible hammer.** Feedback: the hammer and the figure's own body were hard to tell apart color-wise; the hand wasn't clearly shown; and the request got more specific — one shoulder rests against the "M" after hammering, the *other* arm gives the thumbs-up (previously both poses reused the same single arm, crossfading between a hammer and a fist on the same limb).

- **Real second arm added**: the worker now has two independent arm groups instead of one. `.lw-arm-group` (the side facing the wordmark) swings the hammer, then *settles* into a relaxed hanging pose at celebrate time — it no longer disappears (previously faded to `opacity: 0`), so the figure keeps both arms visibly attached rather than looking like a limb vanished. `.lw-arm-far-group` (the side away from the text) starts as a plain static resting arm during the hammering phase, then swaps to the raised fist + thumb at celebrate, on a completely different limb than the one that was hammering.
- **Hammer contrast fixed**: `.lw-hammer-head` was `#4a4a4a` (dark gray) against a `--coffee-light` (`#6d4c41`) arm — similar enough in value that they blurred together at this size. Changed to a light steel `#d4d7db` with a dark `#2c2f33` outline stroke, and the handle to a warm amber `#c98a4a` (also outlined) — both now read as distinct objects from the arm holding them, at a glance, not just on close inspection.
- **Hand added**: there was no hand shape at all — the forearm rect connected directly to the hammer handle rect with nothing bridging them. Added `.lw-hand` (a small skin-toned rounded rect) at the grip point, same color as the head, so the hand is now an identifiable shape rather than implied.
- **Bigger, snappier swing**: widened the swing arc (`rotate(-42deg → 6deg)` to `rotate(-58deg → 18deg)`) and shortened the cycle slightly (1.1s → 1s) so the hammering motion itself reads more clearly as a strike rather than a small wobble.
- **Settle angle tuned by eye, not guessed once and left**: the first attempt at "the hammer arm settles" used `rotate(-4deg)`, which — given the arm's rotation origin near the shoulder and its parts authored pointing "up" at `rotate(0)` — actually left the hammer looking still raised, not resting. Corrected to `rotate(172deg)` after checking a screenshot, which brings the hammer down alongside the body for a genuinely relaxed look.

Note on left/right: for this simple flat 2D figure (no true facing direction or depth), "the shoulder that touches the M" was implemented as whichever side of the body is physically closer to the text in the layout (the hammering arm's side), and "the other hand" as the far arm — matching the functional intent (one side rests against the letter, the other gives the thumbs-up) even though the SVG doesn't model anatomical left/right in a way that maps literally onto "his left" vs "his right."

Verified via Playwright: cropped screenshots at the mid-hammer state (confirms the hammer/hand are now visually distinct from the arm) and the post-celebrate state (confirms the far arm's thumbs-up and the near arm's relaxed hammer-down rest are both visible simultaneously, on different limbs); full-page screenshot confirms no regressions to the headline/box-free layout from the twelfth pass; mobile (390px) still hides the scene cleanly; zero console errors.

**Follow-up (fourteenth pass): full figure rebuild — connected limbs, letter-scale, and a readable lean.** The thirteenth pass's rect-stacked arms still read as disconnected floating blocks (the joints didn't visually join), the thumbs-up wasn't clearly connected shoulder-to-thumb, and — the deeper problem — the worker was ~3× the height of the "M", so "rest the shoulder on the M" was geometrically impossible (the shoulder sits far above a letter beside it). Rebuilt the whole hero figure:

- **Fully isolated from the loader.** The hero SVG previously shared the loader's `.lw-*` / `.illustration-hammer` classes, so every tweak risked breaking the loader (and vice-versa) — the root cause of several earlier cascade-tie bugs. The new figure uses a private `hw-*` namespace and `class="hero-worker"` only (dropped `loader-illustration illustration-hammer`), with a fully self-contained CSS block. The loader's shared rules were reverted to their exact original values so the loader is byte-for-byte back to its 4-random-variant self (verified: its "Driving it home…" variant still renders correctly).
- **Arms are now stroke-based limbs, not stacked rects.** Each arm is drawn as round-capped `<path>` segments (upper arm in shirt color, forearm in skin) with a circle hand at the end — so the shoulder→elbow→hand joints actually connect into one continuous limb. This is the single biggest legibility win; the rects never joined cleanly at any size.
- **Four dedicated arm poses, crossfaded** (instead of rotating one arm into two roles): a swinging hammer arm + a hanging far arm during the build; a hammer-resting-straight-down arm + a raised thumbs-up arm at the finale. Crossfading purpose-authored poses avoids the "rotate the swing arm 180° to fake a rest" contortion that never settled cleanly in pass thirteen.
- **Clearer figure overall**: added real facial features (two eyes + a smile path), a proper hard hat (dome + brim + top knob), a hi-vis vest with gold reflective stripes, and dark outlines on the major shapes so the figure reads against the busy hero photo.
- **Solved the height mismatch by scaling the figure down toward letter-height** (190px → 150px) and pulling it in against the M (`margin-right: -44px`, `margin-bottom: -20px`) so its right side sits at the M's left edge without burying the letters. The finale `rotate(12deg)` lean now visibly tips the figure's right side onto the M — a readable "leaning on the sign" pose — rather than a shoulder floating above an unreachable letter. Honest note kept from pass thirteen: this is the functional realization of "shoulder on the M"; a fully detailed mascot can't literally rest a shoulder on a same-line letter a fraction of its height, so it leans its near side against the M instead.

Verified via Playwright: cropped screenshots at the hammer phase (hammer raised, hand gripping, letters building, arms connected), and the finale (figure leaning onto the M, thumbs-up clearly connected shoulder→fist→thumb, hammer resting head-down); full-page composition screenshot; loader-intact screenshot; mobile (390px) hides the scene; zero console errors.

**Follow-up (fifteenth pass): finger detail, a head that watches then turns, longer hammering, new outfit.** Four requested refinements:

- **Thumbs-up with visible fingers**: the raised hand was a plain circle-fist + a thumb line — no fingers. Replaced with a rounded-rect fist carrying three `hw-knuckle` grooves (the curled fingers) plus a distinct rounded-rect thumb pointing up. Verified with a tight crop that the grooves + thumb read as a proper thumbs-up hand.
- **Head watches the text, then turns**: wrapped the head/face/helmet in a `hw-head-group` (pivot at the neck, `76px 64px`). During hammering it's tilted `rotate(12deg)` toward the lower-right — the worker looks at the M he's striking. At the finale it turns to `rotate(-9deg)` (facing front, roughly upright as the body leans the other way) to give the thumbs-up to the viewer. The neck stays with the torso so only the head turns.
- **Longer hammering**: bumped the swing from 4 iterations to 6 (0.5s each from 1.4s → hammers ~3s, about 1–1.5s past the wordmark finishing), and made the body bob `infinite` (stopped by the finale's `animation: none`) so it keeps moving through the extra swings. `js/app.js` now fires the finale at `max(hammerEnd, buildEnd) + 250ms` (~4.65s) instead of keying purely off the letter-build end, so the worker visibly keeps hammering the finished text before turning.
- **New outfit**: swapped the coffee-shirt / green-vest / gold-helmet look for a classic hi-vis kit — steel-blue work shirt (`#35597a`), safety-orange vest (`#e8722e`) with cream reflective stripes (`#f3e8cf`), navy-denim trousers (`#2c3e57`), and a yellow hard hat (`#eab308`). More recognizably "construction," more colorful, and clearly distinct from the previous dress.

Verified via Playwright: hammer-phase crop (head tilted toward the text, hammer raised, new orange/yellow/blue outfit), finale crop (head front, clear thumbs-up), a tight hand crop (fingers + thumb read), full-page composition, and mobile (390px, scene hidden). Zero console errors; loader still untouched.

**Follow-up (sixteenth pass): abandon the thumbs-up for a pose that actually reads.** Even with finger grooves, the thumbs-up never read reliably at the figure's on-screen size — a thumb is a small feature whose meaning depends on fine detail that's simply below the effective resolution here. Rather than keep tuning an inherently size-fragile gesture, switched the finale to a **proud "job done" foreman stance**: the worker leans by the finished sign with the hammer planted head-down at his near side and his far hand on his hip. Chosen because its meaning is carried by the overall *silhouette* — the hand-on-hip elbow-triangle plus the planted hammer — which stays legible at any size and doesn't rely on any small feature. It's also more on-brand for a construction *business* (conveys competence/pride) than a generic thumbs-up. Implementation was small: the raised-arm SVG group became a bent hand-on-hip arm (`hw-hip`: shoulder → elbow-out → hand-at-waist), and its finale opacity/rename in CSS; everything else from the fifteenth pass (new hi-vis outfit, head watching-then-turning, ~6 hammer swings, planted-hammer near arm) was kept. Removed the now-unused `hw-fist`/`hw-knuckle`/`hw-thumb` styles.

Verified via Playwright: figure-tight zoom (hand-on-hip and planted hammer both read clearly), hammer-phase crop (unchanged — still watches + hammers in the new outfit), full-page composition (proud stance beside the completed "MEGHANA MANOJ"), and mobile (390px, hidden). Zero console errors; loader untouched.

## Illustrated construction motion in the hero + scroll (added same session, seventh pass)

Feedback: extend the loading screen's illustrated-worker style into the hero itself and into the scroll experience, rather than only abstract mouse-tilt/parallax.

- **Hero worker**: the loader's hammer-worker SVG markup is duplicated inline into `.hero-photo-wrap` (not templated/cloned — always rendered, always animating) with classes `loader-illustration illustration-hammer hero-worker`, reusing all of the loader's existing color and hammer-swing keyframes for free. Sits inside the photo-wrap so it moves with the same mouse/scroll 3D parallax as the photo. Hidden below 900px (matches how `.hero-badge-tab` is already hidden there) rather than trying to reflow it into the stacked mobile layout.
- **Scroll-triggered crane**: a second copy of the loader's crane SVG, placed at the top of the Services section header with `reveal reveal-pin` classes — so it scale/bounces into view via the site's existing scroll-reveal `IntersectionObserver`, no new JS needed, and swings continuously once revealed.

**Real bug caught and fixed (third instance of this exact class of bug):** both new SVGs initially rendered at the size of their entire parent container (the hero photo, and the section header) instead of their intended small icon size. Root cause: `.loader-illustration { width: 100%; height: 100%; }` — a rule written for the *loader's* usage, where the SVG should fill its `.loader-scene` container — is declared later in the stylesheet than the new `.hero-worker`/`.section-crane` sizing rules, and both have identical specificity (0,1,0), so the later rule won. Same root cause as the tilt-system bug two passes ago (cascade tie, later-declared rule wins), different symptom. Fixed by bumping the two new rules to `svg.hero-worker` / `svg.section-crane` (element + class = higher specificity) rather than reaching for `!important` again, since a type-selector bump is available and reads more clearly here. Worth noting as a recurring risk in this stylesheet: reusing a shared component's CSS classes outside that component's original context is convenient but silently inherits that component's sizing/positioning assumptions too — worth grepping for the class's other declarations before assuming a new rule for it will simply "add on."

Verified via Playwright: read actual `getBoundingClientRect()` for both elements (not just screenshots) to catch the sizing bug in the first place; confirmed the hammer arm and crane jib bounding boxes change position between animation frames (proof the CSS animations are actually running, not just present in the stylesheet); confirmed mobile (390px) hides the hero worker cleanly with no overlap; zero console errors.

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
