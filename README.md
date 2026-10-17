# rips-website

Website for Radiant Institute of Professional Studies (RIPS), Sheikhupura: rips.edu.pk.

It is a static site built with Eleventy, plus one serverless function for the enquiry form (ADR-01,
ADR-02, ADR-05). The pages are plain HTML. The Home page has a 3D "students at work" journey that
loads only on capable devices (CR-01). It is not deployed yet: the host is an open decision (OD-03).

## Quick start

```sh
npm ci
npm run build                 # validate content, bundle scripts, write _site/
npm run dev                   # http://localhost:8080 with the enquiry form working (mock adapters)
npm test                      # enquiry function tests
npm run check                 # build + HTML, links, accessibility, page-weight and form checks
```

## Layout

| Path | What |
| --- | --- |
| `src/content/` | Programs, notices and news as Markdown with front matter |
| `src/_data/` | Intakes, fees, faculty, site settings, menu, form wording (YAML/JSON) |
| `src/_includes/` | Page layouts and the header and footer |
| `src/pages/`, `src/index.njk` | Pages |
| `src/scripts/` | Browser scripts, bundled by esbuild during the build (menu, enquiry form, list filters, Home motion, 3D scene) |
| `scripts/` | Dev server, checks (`check*.mjs`) and screenshots |
| `src/assets/`, `src/files/` | CSS, fonts, images, 3D files; PDFs (notices, merit lists, downloads) |
| `lib/content-rules.js` | Intake badges, notice archiving, build-time content validation |
| `functions/` | The enquiry function (`POST /api/v1/enquiry`), its adapters and host wrappers |
| `tests/` | Function tests (`npm test`) |
| `holding/` | The single-file M0 "coming soon" page |
| `docs/` | Requirements, decisions, change requests, 3D notes, runbook |

## Documents

- [Runbook](docs/runbook.md): run, check, edit content, enquiry function settings, pre-launch checklist.
- [Architecture decisions ADR-01 to ADR-09](docs/decisions/README.md).
- [Open decisions OD-01 to OD-18](docs/open-decisions.md), and what the site shows until each is
  decided.
- [CR-01: premium 3D and motion](docs/change-requests/CR-01-premium-3d-motion.md).
- [3D assets](docs/3d/README.md).
- Requirements, Docs 01–08 (PDF): [docs/requirements/](docs/requirements/).

Never commit real keys. Settings are listed in `.env.example`, and real values live only in the host's
environment settings.
