# CR-01: Premium 3D and motion on the public site

| | |
| --- | --- |
| Status | Proposed. Built on the `site-foundation` branch for review. The type change (item 3) is approved; the rest needs the owner's approval before launch |
| Raised by | Project owner: the premium 3D and motion brief, then the update of 17 October 2026 (keep the college's navy and gold from the logo; animate students studying rather than the college building) |
| Requirements affected | NFR-PERF-01 (Lighthouse mobile ≥ 85, LCP ≤ 2.5 s, CLS ≤ 0.1), NFR-PERF-02 (≤ 1.5 MB first load), Doc 06 Q27 (type rules) |
| Requirements not changed | Doc 06 Home content order, one filled button per screen area, WCAG 2.1 AA, "no invented facts or statistics" |

## What changes

1. **Home hero and "Your path at RIPS".** One sticky 3D stage sits behind the hero and five chapters.
   Five small dioramas of students at work stand on floating navy platforms joined by a gold path:
   reading at a desk, a lecture, the lab, studying together by the library shelves, and graduation.
   The camera glides from one to the next as the visitor scrolls. The figures are generic, faceless
   illustrations, not RIPS students. Source: `src/scripts/3d/study-scene.js`.
2. **Motion.** Lenis smooth scrolling and GSAP ScrollTrigger reveals on Home; a slight pointer tilt on
   the program cards (01–06); a full-screen menu numbered 01–07 below 1024 px on every page; CSS
   cross-document view transitions between pages.
3. **Type.** Headings (h1, h2) use Instrument Serif, as in the Figma motion storyboard; body text stays
   the system sans-serif. The Home hero headline is larger than Doc 06 Q27's 30 px (up to about 76 px
   on desktop, 34 px on phones). This changes a Doc 06 rule. **The owner approved it on 17 October 2026
   ("Use the headings font").** To undo it, set `--font-display` in `src/assets/css/main.css` to the
   body font and the hero size to 1.875rem.
4. **Campus Explorer** (the SketchUp model of the real building) is no longer on Home, following the
   owner's note that the college itself doesn't need to be animated. Its files stay in
   `src/scripts/3d/campus-explorer.js` and `src/assets/3d/` for a possible Campus page.

## Loading rules (how the budget is kept)

- The page renders with no 3D at all: the stage shows a poster, a still render of the same scene
  (`src/assets/img/study/stop-N-{wide,tall}.webp`, 26–73 KB each). Only the hero poster loads up front.
- three.js and the scene (one lazy chunk, about 150 KB gzipped) load on the visitor's **first scroll,
  touch, pointer move or key press**, and only when the device is capable: WebGL 2 with a hardware GPU
  (software renderers are refused), at least 4 CPU cores and 4 GB memory when the browser reports them,
  and no Save-Data or 2G connection.
- `prefers-reduced-motion: reduce`: no 3D, no smooth scrolling, no reveals, no tilt and no view
  transitions. The posters change with the chapters as a cut, never an animation.
- The render loop pauses when the stage is off screen or the tab is hidden. Shadows only on large
  screens; pixel ratio capped at 1.75 (1.5 on phones).
- Without JavaScript every chapter, link and button still works; the stage shows the hero poster.

## Measurements (17 October 2026)

Built site served locally with gzip; Lighthouse 13.5.0, default mobile (simulated slow 4G, 4× CPU) and
desktop presets. Lighthouse's lab browser has no GPU, so the 3D scene does not run during these tests:
the scores measure the first load, which is what the loading rules above protect.

| Page | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home, mobile (3 runs) | 99, 99, 99 | 100 | 100 | 100 | 2.0 s | 20–50 ms | 0 |
| Home, desktop | 100 | 100 | 100 | 100 | 0.5 s | 0 ms | 0 |
| Pharm-D program page, mobile | 100 | 100 | 100 | 100 | 1.4 s | 0 ms | 0 |
| Programs, mobile | 100 | 100 | 100 | 100 | 1.5 s | 0 ms | 0 |
| Admissions, Enquire, Contact, Notices, mobile (each) | 100 | 100 | 100 | 100 | 1.4 s | 0 ms | 0–0.002 |

The last row and a fourth Home run (99/100/100/100, LCP 2.0 s, TBT 20 ms) were measured after the
remaining pages were added, served with the security headers in `_site/_headers`.

Weight on Home (NFR-PERF-02, uncompressed bytes as served by a host without compression; gzip is
roughly a third of this for text files):

| | Before the first interaction | After the 3D scene loads |
| --- | --- | --- |
| Desktop | 278 KB | 861 KB |
| Phone, posters only | 266 KB | plus one poster (26–73 KB) per chapter reached |

Every other page loads 90–106 KB. `npm run check:weight` measures all of them on each run.

axe-core (WCAG 2.0/2.1 A and AA plus best practice) finds no violations on any built page at 360 and
1366 px, nor on Home with the 3D scene running or with reduced motion (`npm run check:a11y`, served
under the real content security policy). html-validate passes on every built page.

Still to check before launch (NFR-PERF-01 asks for these): PageSpeed Insights on production, and a
real mid-range Android phone on 4G with the 3D scene running (smoothness and battery).

## Files

- `src/scripts/3d/study-scene.js`: the scene. `src/scripts/home.js`: loading rules, Lenis, GSAP, posters.
- `src/scripts/site.js`: the full-screen menu. `src/index.njk`: Home. `src/assets/css/main.css`.
- `docs/3d/render-posters.mjs`: re-renders the posters. `docs/3d/record-journey.mjs`: records the
  scroll-through as MP4 and GIF.
