# CR-03: Home composition adapted from ISL's design language

| | |
| --- | --- |
| Status | Merged in PR #7, 18 October 2026. Its Home layout is replaced by [CR-04](CR-04-isl-layout-rips-colours.md); the permission notes below still apply |
| Raised by | Project owner: rebuild Home in the design of www.isl.school, with RIPS's own identity |
| Permission | "Website Design Language Permission Agreement" between International School Lahore (ISL) and RIPS, dated 18 October 2026, shared by the owner as a PDF, with a copy signed by Shahzad Tahir, Principal of ISL, shared the same day. The owner keeps the signed copy with the project records; it is not in this public repository |
| Replaces | CR-02 item 1 (the Home section order). CR-02's header, menu, photos and "no 3D or motion" stay |
| Requirements affected | Doc 06 Home content order: program cards (max 6) become program-field tiles, the "why RIPS" campus band becomes the campus row, vision and mission and six facts, and the admissions band is dropped. Owner's request, recorded here |
| Requirements not changed | Three hero actions on the first screen of a 360 × 640 phone, admissions status in the hero, at most 5 notices, navy and gold palette (Doc 06 Q05, pending sign-off), approved headings font (CR-01 item 3), WCAG 2.1 AA, "no invented facts or statistics", NFR-PERF-01 and 02 |

## What the permission covers, and what it doesn't

The agreement lets RIPS draw on the general visual and interaction principles of ISL's site (page
composition, spacing, typography hierarchy, colour relationships, navigation patterns) and translate
them into its own original design and code (clauses 01 and 02). It does not allow a duplicate of
ISL's pages or a pixel-for-pixel copy (clause 02), and ISL keeps all rights to its name, crest,
logos, photographs, artwork, copy and code (clause 03). The site must be clearly RIPS's and must not
suggest that ISL runs, sponsors or endorses RIPS (clause 04).

So this change takes only the order and rhythm of ISL's Home sections. Every word, photo, icon,
colour and line of code is RIPS's own: the text comes from the site settings, program files and the
owner's vision and mission; the photos are stills from the RIPS campus tour video; the code is this
repository's. Nothing on the site names ISL.

## What changes on Home

1. **Hero.** On screens 720 px and wider, the RIPS crest, headline, tagline, the three actions and
   the admissions status sit centred on the campus photo. Phones keep CR-02's layout (photo, then the
   headline on navy) so the buttons stay on the first screen.
2. **Our campus.** Four facility photos in a row (anatomy lab, science labs, computer lab, library)
   with small capital labels.
3. **Vision and mission.** Two plain, centred statements.
4. **Why RIPS.** Six facts with small capital titles, each from the tour video or the program files
   (the program count is worked out from the program files, not typed in).
5. **Campus tour.** A classroom photo beside a navy panel linking to the tour video and Contact.
6. **Programs by field.** One icon tile per field, with its number of programs, linking to the
   Programs page filtered to that field (`/programs/?field=…`).
7. **Latest notices** (at most 5) and **Visit or contact us** as a row of labelled details with
   Enquire, WhatsApp, Call and directions buttons.

## Measurements (18 October 2026)

Lighthouse 13.5.0 on the built site served locally with gzip and the security headers: Home mobile
100 / 100 / 100 / 100 (LCP 1.7 s, TBT 0 ms, CLS 0.001); Home desktop 100 / 100 / 100 / 100 (LCP
0.4 s). `npm run check` passes: html-validate, links, axe-core at 360 and 1366 px, weight budget and
the form tests.

## Files

- `src/index.njk`: the Home page.
- `src/assets/css/main.css`: centred hero, campus row, statements, feature grid, tour band, field
  tiles and contact list; the CR-02 Home styles that are no longer used are removed.
