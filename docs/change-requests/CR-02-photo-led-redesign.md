# CR-02: Photo-led redesign of the public site

| | |
| --- | --- |
| Status | Proposed. Built on the `site-foundation` branch for the owner's review |
| Raised by | Project owner, 18 October 2026: stop the 3D Home and rebuild the site in the style of a reference school website (www.isl.school) |
| Replaces | CR-01 items 1, 2 and 4: the 3D Home, the motion and the Campus Explorer. CR-01 item 3, the approved headings font, stays |
| Requirements affected | None. The Home section headings keep the sizes the merged site already had under CR-01 |
| Requirements not changed | Doc 06 Home content order and first-screen rule, at most 6 programs and 5 notices on Home (Doc 06 Q10), Doc 05 Q08 header icons, the navy and gold palette (Doc 06 Q05, still pending sign-off), WCAG 2.1 AA, "no invented facts or statistics", NFR-PERF-01 and 02 |

## What comes from the reference, and what doesn't

Only conventions most school websites share: a white header that stays on screen with an Enquire
button, a wide campus photo behind the headline, program cards, a grid of campus photos, a vision and
mission section, a coloured admissions band and a contact section. No text, photos, logo, colours,
fonts or code come from the reference site, which belongs to International School Lahore. Every word
and photo on the site is RIPS's own: the site settings and program files, the About page and stills
from the RIPS campus tour video (<https://www.youtube.com/watch?v=ccsk4uAyFLM>).

## What changes

1. **Home.** In the Doc 06 order: header → headline on a photo of the main building → Enquire,
   Programs and Admissions → admissions status → program cards (at most 6) → latest notices (at most
   5) → why RIPS: "A modern campus in Sheikhupura" with six campus photos → vision and mission
   (placeholders until approved, Doc 05 Q13) → admissions band → visit or contact → footer. On a
   360 × 640 phone the three hero buttons stay on the first screen.
2. **No 3D or motion.** three.js, GSAP and Lenis are removed from `package.json`, together with the 3D
   scene, its poster stills, the Campus Explorer model and their notes (`docs/3d/`). There is no
   smooth scrolling, scroll reveal, card tilt or page transition; program cards only lift slightly on
   hover, and not with reduced motion. Everything removed is in the git history at commit 079145b,
   for example `git show 079145b:src/scripts/3d/study-scene.js`.
3. **Header and menu.** A white header that stays at the top of the screen. Below 1024 px the menu
   drops down under the header as a plain list, replacing CR-01's full-screen numbered menu. Without
   JavaScript the menu is a wrapped row under the logo and the header does not stick. The call and
   WhatsApp icons beside Enquire on wide screens are unchanged (Doc 05 Q08).
4. **Program cards** on Home and the Programs page show a line icon for the program's field
   (pharmacy, physical therapy, nursing, allied health, computing, business) instead of the program
   initials: `src/_includes/partials/program-icon.njk`.
5. **Campus photos.** Seven 16:9 stills from the RIPS campus tour video: anatomy lab, science lab,
   computer lab, library, classroom, student lounge and the main entrance. Each is cropped clear of
   the video's black bar, its logo overlay and its subtitles, and saved at 640 and 400 px wide
   (6–26 KB each, `src/assets/img/campus/`). They stand in until commissioned photography (OD-12).

## Measurements (18 October 2026)

Built site served locally with gzip and the security headers; Lighthouse 13.5.0, default mobile
(simulated slow 4G, 4× CPU) and desktop presets.

| Page | Performance | Accessibility | Best practices | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home, mobile (3 runs) | 100, 100, 100 | 100 | 100 | 100 | 1.5 s | 0 ms | 0 |
| Home, desktop | 100 | 100 | 100 | 100 | 0.4 s | 0 ms | 0 |
| Programs, mobile | 100 | 100 | 100 | 100 | 1.4 s | 0 ms | 0 |

Home's first load is 144 KB on a phone and 234 KB on desktop (uncompressed, `npm run check:weight`),
against 266–278 KB before the 3D scene loaded under CR-01 and 861 KB after it. axe-core finds no
violations on any page at 360 and 1366 px, and html-validate passes (`npm run check`).

Still to check before launch (NFR-PERF-01): PageSpeed Insights on production, and a real mid-range
Android phone on 4G.

## Files

- `src/index.njk`: Home. `src/pages/programs.njk`: the Programs page cards.
- `src/_includes/partials/header.njk` and `src/scripts/site.js`: the header and drop-down menu.
- `src/assets/css/main.css`: header, Home sections and cards.
