# CR-04: Home in ISL's layout and RIPS's logo colours, and a Why RIPS? page

| | |
| --- | --- |
| Status | Built 18 October 2026. Its Home is replaced by [CR-05](CR-05-home-three-panel-hero.md); the Why RIPS? page stays as built here |
| Raised by | Project owner, 18 October 2026: CR-03's Home was "very bad"; make Home like www.isl.school "for RIPS, not ISL", with "the theme according to the RIPS logo", and add a "Why RIPS?" tab |
| Permission | The same ISL design-language permission as [CR-03](CR-03-isl-design-language.md) (clauses 01 to 05) |
| Replaces | CR-03's Home layout. CR-03's permission notes still apply |
| Requirements affected | Home (dark navy theme, video hero, Poppins headings on Home and Why RIPS? only), main navigation (new first item "Why RIPS?"), footer (Why RIPS? link), new page `/why-rips/` |
| Requirements not changed | Enquire, Programs and Admissions on the first screen of a 360 × 640 phone, admissions status in the hero, at most 5 notices, light theme on every other page, WCAG 2.1 AA, "no invented facts or statistics", NFR-PERF-01 and 02 |

## Measuring ISL's page

The cloud build can't reach www.isl.school. Its Home was measured from the owner's computer: the computed
styles, section heights and section screenshots at 1366 px, plus the layout Wix serves at 320 px.
Those measurements are the reference here. ISL's page is black, with yellow (#FFDA24) and blue
(#317AE8) accents.

## What is taken from ISL, and what is RIPS's own

Taken from ISL's design language:

- the section order;
- the proportions;
- a slim header bar;
- a full-screen video hero with a large centred crest, a wide-spaced capital wordmark and one outlined
  pill button;
- four slanted campus panels on a gold glow;
- a vision and mission zig-zag over a faint hourglass shape, with the key words in the accent colour;
- a ruled 3 × 2 "Why" grid of darkened photo tiles that fill with the accent colour on hover;
- a heading line over a full-width teaching photo;
- programs as flat alternating label buttons over a darkened building photo;
- a contact strip of four columns divided by hairlines.

RIPS's own:

- **Colours:** from the RIPS logo and banner. Deep navy #051F3A, logo navy #0D2740, gold #E1C482, white text. None of ISL's black, yellow or blue is used.
- **Hero media:** the RIPS crest, cut out in gold from the owner's admissions banner (`crest-gold.webp`), and a 6-second, 2 × 2 collage of clips from the RIPS campus tour video.
- **Text:** the RIPS name, tagline, vision, mission, programs and contact details.
- **Code:** this repository's own.

Nothing names ISL. None of its crest, "Markhor" button, campus names, claims, photos or contact details is used.

## What changes

1. **Header** (Home and Why RIPS? only). A navy bar with the gold crest and name. The links are white, and the current link is gold. Enquire is a gold outlined pill.
2. **Hero**:
   - the gold crest and the name in gold capitals, with the tagline under them;
   - an outlined "Apply for admission" pill, with Enquire and Programs links under it;
   - the admissions status.

   The video collage plays only on screens 720 px and wider, with JavaScript, without reduced motion and without Save-Data. It is WebM (VP9) where supported and MP4 (H.264) for Safari. Otherwise the poster still shows. A Pause/Play button sits at the bottom left (WCAG 2.2.2).
3. **Our campus.** Four slanted panels on a gold glow: Main building, Admission Office, Labs and Library. They link to About, Admissions and the Why RIPS? sections. On phones they stack.
4. **Our Vision / Our Mission.** The owner's text with key phrases in gold, in a left and right zig-zag.
5. **Why RIPS?** Six photo tiles. The text appears on hover or keyboard focus, and always shows on touch screens. A "View more" pill goes to `/why-rips/`.
6. **Learning at RIPS.** A full-width classroom still. It is captioned as temporary until a faculty photo is supplied.
7. **Programs.** One label button per field, with its program count, linking to the filtered Programs page.
8. **Latest notices**, at most 5.
9. **Contact.** Four columns: Address (with directions), Phone (with office hours), Email, and Connect (WhatsApp and Enquire).
10. **Motion.** Sections fade up once as they enter the screen. This is off with reduced motion and without JavaScript.

**Why RIPS? page** (`/why-rips/`):

- seven illustrated reasons, one per campus facility and service;
- program and field counts worked out from the program files;
- scholarships, internships and affiliation, each marked `data-draft` (OD-07 and OD-08) because they come from the tour video's description;
- a closing band with Enquire, WhatsApp and the tour video.

## Assets still needed

- A faculty or teaching photo for "Learning at RIPS" (OD-12).
- Commissioned campus photos to replace the tour-video stills (OD-12).
- A vector or large transparent PNG of the crest. The hero crest is cut from a 1600 px banner and is sharp only up to about 150 px.
- Facebook and Instagram addresses, if they should appear under Connect (`settings.social` is empty).

## Measurements (18 October 2026)

`npm run check` passes:

- html-validate;
- links;
- axe-core at 360 and 1366 px and with reduced motion;
- the form tests (8/8);
- weight on first load: Home 260 KB on a phone and 308 KB on desktop, Why RIPS? 207 KB and 276 KB.

The hero video (440 KB WebM, 531 KB MP4) loads after the page, on wide screens only.

## Files

- `src/index.njk`: Home.
- `src/pages/why-rips.njk`: new page.
- `src/scripts/home.js`: video, pause button and reveals. It is bundled through `eleventy.config.js`.
- `src/assets/css/main.css`: the "Cinematic pages (CR-04)" block. The CR-03 Home styles are removed.
- `src/_data/nav.yaml` and `src/_includes/partials/header.njk`, `footer.njk`: the Why RIPS? tab, the footer link, and the gold crest on dark pages.
- `src/assets/fonts/poppins-500.woff2`, `poppins-600.woff2`, `OFL-poppins.txt`.
- `src/assets/video/hero-collage.webm`, `.mp4`.
- `src/assets/img/crest-gold.webp`.
- New stills in `src/assets/img/campus/`: `hero-collage-*`, `classroom-wide-*` and `admission-office-*`.
