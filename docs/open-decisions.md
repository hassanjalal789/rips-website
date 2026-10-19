# Open decisions

From the Doc 03 SRS open decisions register (OD-01 to OD-18). All are still **Open** as of 18 October
2026. Nothing here has been decided in the code. Where the site needs a value, it shows a visible
placeholder: `[TO CONFIRM — what, OD-xx]`.

On 18 October 2026 the owner gave the WhatsApp number, email, map link, program list, vision and
mission, and asked for everything else to be filled in for now, to edit once the design is final.
Those fillers are **drafts**: they read as normal text, but each one is marked `data-draft="OD-xx"` in
the page (or listed in `draft_fields` in `src/_data/settings.yaml`), and `npm run check` lists them
under "Drafts to approve". A draft blocks launch just like a placeholder until the owner confirms it. The `tbc` shortcode and filter in `eleventy.config.js`
render these with the class `tbc`. `sample: true` content is marked SAMPLE on the page. Placeholders
and SAMPLE content must all be gone before launch (SRS T-07: "Placeholder or template text anywhere"
blocks launch).

To find every place a decision shows: `grep -rn "OD-14" src functions holding .env.example`. The
"Shows in" column is a guide; the grep is the full list.

| ID | Decision | Owner / due | What the site does meanwhile | Shows in |
| --- | --- | --- | --- | --- |
| OD-01 | Single approver for requirements, scope and launch | Chairman / before SRS sign-off | Nothing in the site. Sign-offs (SRS T-09, Doc 05 Q39) wait for this | Process only |
| OD-02 | Launch date (before next intake) | Director / before development | Nothing deployed | Process only |
| OD-03 | New hosting provider | Director with developer / before development | Host-neutral build; function wrapper for Fetch-API hosts; nothing deployed (ADR-04) | `functions/platforms/fetch.js`, `functions/adapters/memory-rate-limiter.js`, `.env.example`, `holding/README.md` |
| OD-04 | Email provider and how MX records move | Director with developer / before DNS switch | Admissions email from the owner on 18 October 2026: radiantcollagesheikhupura@gmail.com, spelled as given. The email adapter is still a stub; mock mailer in development (ADR-06) | Footer, `src/_data/settings.yaml`, `functions/adapters/email.js`, `holding/` |
| OD-05 | Admin and content-editing tool | Developer, approved by Director / before development | Content is plain Markdown and YAML edited as files; no CMS configuration (ADR-03, ADR-09) | `src/content/`, `src/_data/` |
| OD-06 | Form-and-email service and its plan limits | Developer / before development | Own function with mock adapters; Google Sheet adapter is a stub; no CAPTCHA provider, honeypot + rate limit only (ADR-05, ADR-07). The privacy policy draft says enquiries are kept in a private spreadsheet and announced by email (`data-draft`) | `functions/adapters/google-sheet.js`, `functions/adapters/captcha.js`, `.env.example`, Privacy page |
| OD-07 | Final program list, exact degree titles, fees, eligibility | Principal and admissions / before content entry | The owner's list of 18 October 2026: 14 BS and 8 intermediate programs (`confirmed: false`). Names are the owner's; duration, eligibility, overview, outline and careers are drafts (`data-draft`), as are the admission steps, documents and scholarships text. Fee amounts are null and show "Contact admissions". Intake dates are SAMPLE values, marked as drafts. The list's "Diploma Programs" heading had no programs, so none are shown | `src/content/programs/*.md`, `src/_data/fees.yaml`, `src/_data/intakes.yaml`, program layout, Programs, Home and Admissions pages |
| OD-08 | Affiliation and approval documents and wording | Director / before content entry | Drafts (`data-draft`): BS programs with GC University Faisalabad (named in the tour video), intermediate health-science programs with the Punjab Medical Faculty, FSc Medical and ICS with BISE Lahore (inferred from the location). No affiliation logos in the footer | Affiliation page, program pages, `src/_data/settings.yaml` (`affiliation_logos: []`) |
| OD-09 | Official spelling of the institute's name; use of "University" | Chairman / before design | "Radiant Institute of Professional Studies", as on the logo artwork and campus sign; flagged in settings | `src/_data/settings.yaml`, `holding/index.html` |
| OD-10 | Retention periods (enquiries, notices, logs) | Director / before launch | Proposed values are used: notices leave the site 2 years after archiving (`lib/content-rules.js`); the privacy policy draft keeps enquiries 12 months after their intake closes (`data-draft`), which the site does not enforce (it lives in the sheet) | `lib/content-rules.js` (`NOTICE_REMOVE_AFTER_DAYS`), Privacy page |
| OD-11 | Urdu pages in release 1 or later | Director / before content entry | English only; `lang`/`dir` in settings and an Urdu font stack are ready for `/ur/` later | `src/_data/settings.yaml`, `src/assets/css/main.css` |
| OD-12 | Budget for hosting, services and photography | Director / before development | Free tiers assumed in the docs. Campus photos are stills from the tour video, captioned as such | Home campus band |
| OD-13 | Baseline figures (enquiries per intake, calls) | Admissions officer / before launch | No figures or counters on the site ("no invented statistics") | Not shown |
| OD-14 | Admissions WhatsApp number, phone and office hours | Admissions officer / before development | WhatsApp +92 327 4103941 from the owner on 18 October 2026, also used for calls (draft). Map link: the owner's Google Maps share link. Address "Sheikhupura, Punjab, Pakistan" (no street yet) and office hours 8:00 AM to 3:00 PM from the reference page are drafts. `draft_fields` in settings lists phone, address and office_hours | Footer, Home contact strip, `src/_data/settings.yaml`, `holding/` |
| OD-15 | Legal review: data protection, retention, regulator rules | Director (legal counsel) / before launch | The privacy policy and terms are drafts for legal review, marked `data-draft` (no visible notice). Storing enquiries in Google and analytics consent (ADR-08) wait for this | Privacy and Terms pages, `functions/adapters/google-sheet.js`, `.env.example` |
| OD-16 | Staging address (proposed staging.rips.edu.pk) | Developer / before M2 | No staging; depends on the host (OD-03) | Not shown |
| OD-17 | Ownership of test.rips.pk; take down or hide it | Director with developer / immediately | Not handled by this repo | Not shown |
| OD-18 | Whether to show official bank details for fee deposit | Director and admissions / before launch | No bank details anywhere. Admissions and Terms say RIPS never asks for fees to be paid into a personal account | Not shown |

## Raised during the build

These come from material the owner shared in October 2026. They are recorded here so they are not
lost. None are used on the site until someone confirms them.

- **Facts on the owner's reference page** (the claude.ai mock-up shared on 17 October 2026). None of
  these are confirmed by an approved document:
  - phone numbers, an email address and office hours (8:00 AM – 3:00 PM) (OD-14, OD-04);
  - "5,000+ students" and "4 faculties, 11 programmes" (OD-13, OD-07);
  - "50% scholarship for the first 25 students" and "established 2025";
  - affiliation with GCU Lahore and IUB, and the councils PCP, PMF and PNC (OD-08);
  - named leaders and their messages (Doc 05 Q02: leadership content is to be rewritten and
    re-approved).

  The campus tour video names GC University Faisalabad, which also conflicts with the reference page
  (OD-08).
- **Program list (OD-07).** The campus tour video lists 13 programs: Pharm D, DPT, BS Nursing,
  Post RN, LHV/CNA/CMW, BS MLT, Microbiology, Biotechnology, Biochemistry, BS RIT, BBA, B.Ed and
  BS English Literature. On 18 October 2026 the owner sent the full list instead, and the site now
  shows it: BS Nursing, Pharm-D, BBA, BS Computer Science, BS DPT, BS RIT, BS Mass Communication, BS IT,
  BS English Literature (and Bridging), BS Accounting & Finance, BS HND, BS Data Science and BS
  Computer Science Bridging; FSc Medical, ICS, FSc MLT, FSc Nursing, FSc Dispensing, FSc Dental, FSc
  OTT and FSc RIT. The six Doc 05 working examples were replaced. Program codes (slugs) are new.
- **Vision and mission (Doc 05 Q13).** The owner's wording of 18 October 2026 is on Home and About.
- **Not filled in.** Content that needs the people concerned is left out rather than drafted: the
  Chairman's and Principal's messages, leadership other than the Chairman's name, faculty profiles,
  fee amounts and bank details. About has no Messages section until they are written (Doc 05 Q02);
  Faculty says profiles will be added soon. Example notices and the news post stay marked SAMPLE.
- **Domain.** The tour video's end card shows www.rips.pk; the brief and all documents say rips.edu.pk.
  The build uses rips.edu.pk (`settings.url`).
- **Decided: headings font.** The owner approved Instrument Serif for headings, and the larger Home
  hero headline, on 17 October 2026 ([CR-01](change-requests/CR-01-premium-3d-motion.md) item 3).
  This changes Doc 06 Q27. The rest of CR-01 (the 3D Home and motion) was dropped on 18 October 2026,
  when the owner asked for a photo-led redesign ([CR-02](change-requests/CR-02-photo-led-redesign.md)).
- **Decided: Home composition.** On 18 October 2026 the owner asked for Home in the design of
  www.isl.school and shared ISL's design-language permission. Home now follows that section order
  in RIPS's own words, photos, colours and code ([CR-03](change-requests/CR-03-isl-design-language.md)).
  This changes the Doc 06 Home content order.
- **Decided: Home theme and a Why RIPS? page.** Later on 18 October 2026 the owner asked for Home
  like ISL's but in the colours of the RIPS logo, and for a "Why RIPS?" tab. Home and the new
  `/why-rips/` page use a navy and gold theme ([CR-04](change-requests/CR-04-isl-layout-rips-colours.md));
  every other page keeps the light theme.
- **Decided: Home's opening and colours.** On 19 October 2026 the owner asked for ISL's opening sequence:
  three tall video panels with the crest, the name and one pill revealed over them, in near-black,
  charcoal and gold. Home now follows that ([CR-05](change-requests/CR-05-home-three-panel-hero.md));
  the RIPS logo navy stays as the second programme-button colour. Why RIPS? keeps CR-04's navy.
