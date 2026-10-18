# Runbook

How to run, check, edit and (later) launch rips.edu.pk. This covers the Doc 07 Q34 maintainer
documentation. The operating procedures in SRS S-06 and Doc 07 Q30 (holding page, rollback,
restoring the sheet, rotating keys, re-pointing DNS) need a host first; they are at the end as
"after the host is chosen".

## 1. Set up

Needs Node 20 or newer (`package.json` `engines`).

```sh
npm ci
```

Playwright's Chromium (screenshots, accessibility, weight and form checks) is a dev-only tool, needed
only for the scripts that say so.

Without a local set-up, open the repository in a GitHub Codespace
(<https://codespaces.new/hassanjalal789/rips-website>). `.devcontainer/devcontainer.json` runs
`npm ci` and a build, starts `npm run dev` and opens the site in the browser. The forwarded address is
private to the GitHub account that opened the codespace, and the enquiry form works there too (mock
adapters). It is a preview, not a deployment (OD-03).

## 2. Build and preview

| Command | What it does |
| --- | --- |
| `npm run build` | Runs Eleventy. Validates content (the build fails on a missing field or unknown program code), bundles `src/scripts/` with esbuild into `_site/assets/js/`, writes the site to `_site/`, then regenerates `functions/generated/site-data.js` (program codes and cities for the enquiry function). |
| `npx @11ty/eleventy --serve` | Builds and serves the pages at http://localhost:8080 with live reload. No enquiry function. |
| `npm run dev` | Rebuilds on change and serves http://localhost:8080 with the real security headers, plus the enquiry endpoint using the mock adapters (`scripts/dev.mjs`, which uses `functions/platforms/node-http.js`). The form works end to end; enquiries stay in memory. |
| `SITE_ENV=staging npm run build` | Staging build (SRS S-02): every page gets `noindex`, `robots.txt` blocks all crawlers, the sitemap is empty, `_headers` adds `X-Robots-Tag: noindex`, and a "STAGING — not the real website" banner shows. Any other value builds the public site. |
| `BUILD_DATE=2026-11-28 npm run build` | Builds as if today were that date (Pakistan time), to preview intake badges and notice archiving (`src/_data/build.js`). |

## 3. Test and check

| Command | What it checks |
| --- | --- |
| `npm test` | Enquiry function unit tests (`tests/`): validation, token reuse, duplicate flag, rate limit, formula escaping, origin, size and type limits, sheet and email failure paths, no personal data in responses or logs (Doc 08 Q40). |
| `npm run check` | Builds, then runs the checks Doc 07 Q31 asks for on every build: HTML validation (html-validate), broken internal links and #anchors, an accessibility scan (axe-core in Chromium, every page at 360 and 1366 px, served under the real content security policy so a blocked script also fails), the page-weight budget (1.5 MB first load, NFR-PERF-02) and a browser test of the enquiry form and notice filters (`scripts/check-form.mjs`). It ends with a count of what still blocks launch: placeholders by OD, SAMPLE tags, dummy contact links and drafts to approve. |
| `npm run check:html`, `check:links`, `check:a11y`, `check:weight` | The same checks one at a time, against an existing `_site/`. `node scripts/check-form.mjs` runs the form test alone. |
| `npm run screenshots [-- outdir]` | Full-page screenshots of the main pages at 360 and 1366 px (default `reports/screenshots/`, not committed). |

Lighthouse is not part of `npm run check`. Run it on the four key pages before each release (Doc 07
Q32; SRS T-05: mobile performance 85 or higher, LCP 2.5 s or less). The figures for this branch are in
CR-02.

## 4. Edit content

All content is plain files. Every change is a commit, so Git history is the record of who changed what
and when (Doc 08 Q11). The editing tool is not chosen yet (OD-05, ADR-03).

| Content | File | Notes |
| --- | --- | --- |
| Programs | `src/content/programs/<code>.md` | Required: `slug`, `title`, `short`, `field`, `level`, `status`. The code (`slug`) is never changed or reused (Doc 08 Q09). Withdraw with `status: Withdrawn`; never delete. |
| Notices and merit lists | `src/content/notices/<session>-<short-title>.md` | Required: `slug`, `title`, `type`, `program`, `publish_at`, `archive_on`, `file`, `status`. PDFs of 5 MB or less in `src/files/notices/`. Merit lists need `session`, `approved_by` and a PDF in `src/files/merit-lists/`; they are never indexed. Only `status: Published` notices whose `publish_at` has passed are built. |
| News posts | `src/content/news/<short-title>.md` | Required: `slug`, `title`, `date`, `summary`, `status`. |
| Intake dates | `src/_data/intakes.yaml` | Status badges (Upcoming, Open, Closing soon, Closed) are calculated from these dates. |
| Fees | `src/_data/fees.yaml` | Amounts are shown exactly as entered (SRS E-07). Record `approved_by` and `approved_on` with every change. |
| Faculty | `src/_data/faculty.yaml` | |
| Contact details, name, social links | `src/_data/settings.yaml` | Edited once, shown everywhere (Doc 05 Q32). |
| Menu | `src/_data/nav.yaml` | Menu changes need the Director's approval (Doc 05 Q34). |
| Form error wording | `src/_data/enquiryMessages.json` | The only place this text lives (SRS F-07). |

Three markers mean "not real yet":

- `sample: true` in front matter or data marks working-example content; pages show a SAMPLE tag.
- `null` values, and the `{% tbc "what", "OD-xx" %}` shortcode, show a visible
  `[TO CONFIRM — what, OD-xx]`.
- `data-draft="OD-xx"` on an element, `confirmed: false` on a program and `draft_fields` in
  `settings.yaml` mark filled-in drafts: text that reads normally but has not been approved. They are
  not visible on the page; `npm run check` lists them.

Replace each with approved content, then set `sample: false` (or remove it). The open decisions behind
each placeholder are listed in `docs/open-decisions.md`.

Placeholder PDFs can be made with `node scripts/make-sample-pdf.mjs <out.pdf> "Line one" …`; they are
stamped SAMPLE.

## 5. Daily rebuild

Intake badges and notice archiving are worked out at build time, so the live site must be rebuilt every
day (Doc 07 Q08; SRS E-07). Without it, a badge stays "Open" after the closing date. Set this up as a
scheduled build on the chosen host (OD-03).

## 6. Enquiry function

- Code: `functions/lib/handler.js` (`POST /api/v1/enquiry`, Doc 08 endpoint specification).
- Adapters: `functions/adapters/`. Configuration: `functions/config.js`.
- Host wrappers: `functions/platforms/fetch.js` (Fetch-API hosts) and `functions/platforms/node-http.js`
  (local).
- It is not deployed. The Google Sheet and email adapters are stubs until OD-06, OD-04 and OD-15 are
  decided (ADR-05, ADR-06).

Environment settings are listed in `.env.example`. Real values go only in the host's encrypted
settings, one set per environment, never in the repository (Doc 07 Q13, Q14).

| Variable | Purpose |
| --- | --- |
| `ALLOWED_ORIGINS` | Origins allowed to post (comma separated) |
| `SHEET_ADAPTER`, `EMAIL_ADAPTER`, `CAPTCHA_ADAPTER` | `mock` (or `none` for the CAPTCHA) until real adapters exist |
| `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_KEY` | Enquiry sheet (ADR-05) |
| `ADMISSIONS_EMAIL`, `ALERT_EMAIL`, `EMAIL_FROM`, `EMAIL_API_KEY` | Email (ADR-06) |
| `CAPTCHA_SECRET` | Spam check (ADR-07); empty means honeypot and rate limit only |
| `CONSENT_VERSION` | Consent wording version stored with each enquiry (Doc 08 Q22) |

Use only fictional test data, such as "Test Student One" and 0300 0000001 (Doc 07 Q33; Doc 08 Q17).

## 7. Deployment

**Not done.** The host is an open decision (OD-03, ADR-04), as are the staging address (OD-16), email
(OD-04) and the budget (OD-12).

Once the host is chosen, Doc 07 Q13 sets the flow:

1. Work on a branch, with checks passing.
2. Push to the staging branch; the host deploys password-protected staging.
3. Review and approve on staging (SRS T-09).
4. Merge to `main` and tag the release; the host makes an atomic production deploy.

Rollback is the previous deploy, within 15 minutes (SRS S-07). The holding page (`holding/`) can go up
within 30 minutes.

The M0 holding page is ready in `holding/`. See `holding/README.md` for its placeholders.

## 8. Before launch

SRS T-07 lists what blocks launch. For this codebase:

- [ ] Every `[TO CONFIRM …]` and SAMPLE item replaced with approved content. Search for `TO CONFIRM`,
      `sample: true` and `SAMPLE` in `_site/`; none may remain.
- [ ] Every draft confirmed by the owner: `data-draft` in `_site/`, `confirmed: false` in
      `src/content/programs/`, and `draft_fields` in `src/_data/settings.yaml` (`npm run check` lists
      them). Remove each marker once its text is approved.
- [ ] Security headers deployed (Doc 07 Q24; SRS O-06):
  - HTTPS only with HSTS;
  - a content security policy that includes the sha256 hash of the one inline script;
  - frame-ancestors denied;
  - no-index on merit-list PDFs (`/files/merit-lists/`).

  All of these are written by the build to `_site/_headers` (from `src/_headers.njk`), in the format
  Netlify and Cloudflare Pages read; translate it if the chosen host uses another format. The script
  hash is computed from `src/_data/inlineScripts.js`, so it cannot go stale. `npm run dev` and the
  checks serve the site with these headers.

  Check with SSL Labs (grade A) and a security-headers scan (A or B) (SRS T-05).
- [ ] Cache rules (Doc 07 Q27): versioned scripts and images for a year; HTML and PDFs for minutes;
      the function never cached.
- [ ] `sitemap.xml` lists indexable pages only; `robots.txt` published (SRS S-03; Doc 05 Q24).
- [ ] PageSpeed Insights on production, and a real mid-range Android phone on 4G (NFR-PERF-01).
- [ ] Enquiry tested end to end on staging, including a simulated function failure (Doc 07 Q38).
- [ ] Indexing: staging is built with `SITE_ENV=staging` (noindex everywhere, crawlers blocked, banner)
      and password-protected by the host (SRS S-02). Production is built without it. Pages with
      `noindex: true` (merit lists, removed notices, Thank-you, Terms, 404) are never indexed.
- [ ] Staging differences (SRS S-02): a test mailbox and analytics off (the banner comes from
      `SITE_ENV=staging`).
- [ ] DNS and MX records at DOMAIN.pk recorded before any change (Doc 07 Q15); Search Console verified
      and the sitemap submitted (SRS T-08).
- [ ] Privacy policy approved by legal review (OD-15) and linked under every form (SRS O-08).

## 9. After the host is chosen

Write these operating procedures then, because they depend on the host's dashboard (Doc 07 Q30;
SRS S-06, O-12):

- switch on the holding page;
- roll back a deploy;
- restore the sheet from version history or the weekly export;
- rotate keys;
- re-point DNS;
- unlock staff accounts;
- host and registrar support contacts.
