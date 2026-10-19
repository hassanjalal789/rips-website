# CR-05: Home with ISL's three-panel opening, in near-black and RIPS gold

| | |
| --- | --- |
| Status | Built on the `site-foundation` branch at the owner's request, 19 October 2026 |
| Raised by | Project owner, 19 October 2026: after watching ISL's opening (three vertical videos, then a large crest, gold title and gold-outline button over them), "rebuild ONLY the RIPS homepage" with that composition, near-black and gold |
| Permission | The ISL design-language permission of [CR-03](CR-03-isl-design-language.md) (clauses 01 to 05). Nothing names ISL; no ISL crest, wording, photos, campus names, claims or contacts are used |
| Replaces | CR-04's Home. The Why RIPS? page and every other page are unchanged |
| Requirements not changed | Apply, Enquire and Programs on the first screen of a 360 × 640 phone; admissions status in the hero; at most 5 notices; WCAG 2.1 AA; no invented facts |

## What changes on Home

1. **Header.** A 70 px near-black bar: the gold crest and name on the left of a centred row, compact light links on the right, Enquire as a thin gold pill. Below 1024 px, a Menu button opens a dark drop-down with Enquire in gold.
2. **Hero.** Three equal tall video panels in one row, divided by thin black lines, 72 % of the screen height on desktop and the full first screen on phones.
   - The footage shows first. A dark shade, the crest, the name in wide-spaced gold capitals, the tagline, a gold-outline "Apply for admission" pill, Enquire and Programs links and the admissions status then rise over it.
   - Each panel has a poster photo. Videos load only without reduced motion or Save-Data, as WebM (VP9) or MP4 (H.264). One button pauses all three (WCAG 2.2.2). With reduced motion the brand shows at once.
3. **Our campus.** A gold heading band, then the main campus from the air, full width, with a dark shade, its caption and links to the facilities on the Why RIPS? page.
4. **Vision and mission** over a darkened dusk view of the campus.
5. **Why RIPS?** A white lead-in with a large heading, then a 3 × 2 grid of charcoal tiles with thin gold borders and condensed gold capitals. A tile's text shows on hover or keyboard focus, and always on touch screens. Tiles stack on phones.
6. **Learning at RIPS.** One wide classroom photo in a thin gold frame, captioned as temporary.
7. **Programs.** Rectangular field buttons, gold and RIPS navy, over a blurred and darkened library photo.
8. **Latest notices** as dark rows with a gold rule.
9. **Contact.** Four black columns with hairline dividers, white icons, gold headings and gold buttons; the site footer below is black with light links.

## Cache fix

The owner's screenshots showed the page unstyled. The dev server tells browsers to keep `/assets/*` for a day, so the old stylesheet stayed in use. Stylesheet and script links now carry a content hash (`main.css?v=…`), so a changed file is always fetched again.

## Assets still needed

- Three short campus video clips (about 6 seconds each, portrait or square) to replace the clips cut from the tour video (OD-12).
- A faculty or teaching photo for "Learning at RIPS" (OD-12).
- A vector or large transparent PNG of the crest. The current crest is sharp only up to about 150 px and is shown at 190 px.
- Facebook and Instagram addresses, if they should appear under Connect.

## Measurements (19 October 2026)

`npm run check` passes: html-validate, links, axe-core at 360 and 1366 px and with reduced motion, form tests 8/8, and weight. Home is 682 KB on a phone and 731 KB on desktop on first load, including the three hero videos (about 120 to 160 KB each), within the 1.5 MB budget. No horizontal scrolling at 390 or 1440 px.

## Files

- `src/index.njk`, `src/scripts/home.js`.
- `src/assets/css/main.css`: the "Home (CR-05)" block; CR-04's Home styles removed.
- `eleventy.config.js` (`assetUrl` filter) and `src/_includes/layouts/base.njk`: cache-busting links.
- `src/assets/video/panel-campus`, `panel-learning`, `panel-life` (`.webm`, `.mp4`) and posters `src/assets/img/campus/hero-*.webp`; `front-dusk-854.webp`.
- `src/assets/fonts/oswald-500.woff2`, `OFL-oswald.txt`.
- Removed: `hero-collage` video and stills.
