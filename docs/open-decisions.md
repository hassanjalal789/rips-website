# Open decisions

From the Doc 03 SRS open decisions register (OD-01 to OD-18). All are **Open** as of 17 October 2026.
Nothing here has been decided in the code. Where the site needs a value, it shows a visible
placeholder: `[TO CONFIRM — what, OD-xx]`. The `tbc` shortcode and filter in `eleventy.config.js`
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
| OD-04 | Email provider and how MX records move | Director with developer / before DNS switch | Email adapter is a stub; mock mailer in development. `[TO CONFIRM — admissions email, OD-04]` on pages (ADR-06) | Footer, `src/_data/settings.yaml` (`email: null`), `functions/adapters/email.js`, `holding/` |
| OD-05 | Admin and content-editing tool | Developer, approved by Director / before development | Content is plain Markdown and YAML edited as files; no CMS configuration (ADR-03, ADR-09) | `src/content/`, `src/_data/` |
| OD-06 | Form-and-email service and its plan limits | Developer / before development | Own function with mock adapters; Google Sheet adapter is a stub; no CAPTCHA provider, honeypot + rate limit only (ADR-05, ADR-07) | `functions/adapters/google-sheet.js`, `functions/adapters/captcha.js`, `.env.example` |
| OD-07 | Final program list, exact degree titles, fees, eligibility | Principal and admissions / before content entry | Six working-example programs marked `SAMPLE, OD-07`. Duration, eligibility, fees and overviews are `[TO CONFIRM … OD-07]`. Fee amounts are null. Intake dates are SAMPLE | `src/content/programs/*.md`, `src/_data/fees.yaml`, `src/_data/intakes.yaml`, program layout, Programs and Home pages |
| OD-08 | Affiliation and approval documents and wording | Director / before content entry | `[TO CONFIRM — affiliating university and approvals, OD-08]`; no affiliation logos in the footer | Home campus band, program layout, `src/_data/settings.yaml` (`affiliation_logos: []`) |
| OD-09 | Official spelling of the institute's name; use of "University" | Chairman / before design | "Radiant Institute of Professional Studies", as on the logo artwork and campus sign; flagged in settings | `src/_data/settings.yaml`, `holding/index.html` |
| OD-10 | Retention periods (enquiries, notices, logs) | Director / before launch | Proposed values are used: notices leave the site 2 years after archiving (`lib/content-rules.js`); enquiry retention is not enforced by the site (it lives in the sheet) | `lib/content-rules.js` (`NOTICE_REMOVE_AFTER_DAYS`) |
| OD-11 | Urdu pages in release 1 or later | Director / before content entry | English only; `lang`/`dir` in settings and an Urdu font stack are ready for `/ur/` later | `src/_data/settings.yaml`, `src/assets/css/main.css` |
| OD-12 | Budget for hosting, services and photography | Director / before development | Free tiers assumed in the docs. Campus photo is a still from the tour video, captioned `[TO CONFIRM — commissioned photography, OD-12]` | Home campus band |
| OD-13 | Baseline figures (enquiries per intake, calls) | Admissions officer / before launch | No figures or counters on the site ("no invented statistics") | Not shown |
| OD-14 | Admissions WhatsApp number, phone and office hours | Admissions officer / before development | `[TO CONFIRM — admissions phone / WhatsApp number / office hours / verified address, OD-14]`. `tel:` and `wa.me` links use dummy numbers from settings (`phone_link`, `whatsapp_link`) that must never be published | Footer, Home contact strip, `src/_data/settings.yaml`, `holding/` |
| OD-15 | Legal review: data protection, retention, regulator rules | Director (legal counsel) / before launch | Privacy wording and storing enquiries in Google wait for this; analytics consent (ADR-08) too | `functions/adapters/google-sheet.js`, `.env.example` |
| OD-16 | Staging address (proposed staging.rips.edu.pk) | Developer / before M2 | No staging; depends on the host (OD-03) | Not shown |
| OD-17 | Ownership of test.rips.pk; take down or hide it | Director with developer / immediately | Not handled by this repo | Not shown |
| OD-18 | Whether to show official bank details for fee deposit | Director and admissions / before launch | No bank details anywhere | Not shown |

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
  BS English Literature. The site still shows the six working examples from Doc 05. Switching to the
  13 was put to the owner and is waiting for an answer.
- **Domain.** The tour video's end card shows www.rips.pk; the brief and all documents say rips.edu.pk.
  The build uses rips.edu.pk (`settings.url`).
- **Decided: headings font.** The owner approved Instrument Serif for headings, and the larger Home
  hero headline, on 17 October 2026 ([CR-01](change-requests/CR-01-premium-3d-motion.md) item 3).
  This changes Doc 06 Q27. The rest of CR-01 (the 3D Home and motion) was dropped on 18 October 2026,
  when the owner asked for a photo-led redesign ([CR-02](change-requests/CR-02-photo-led-redesign.md)).
