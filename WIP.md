# Work in progress (handover)

This branch was started in a cloud session and is continuing in Claude Code on the developer's computer.

Done and committed:
- holding/ — M0 holding page (single file)
- package.json scripts, .editorconfig, .env.example
- functions/ — host-neutral enquiry function, mock adapters, 44 passing tests (`npm test`)
- lib/content-rules.js — intake badges, notice archiving, build-time content validation
- eleventy.config.js, src/_data/*, src/content/* (SAMPLE programs, notices, news), src/assets/css/main.css, src/assets/img/*
- docs/requirements/ — Docs 01–08 PDFs; docs/brand/ — logo banner source

Still to do (user's brief, in order): layouts and components (src/_includes), every page in the Doc 05
inventory (src/pages), browser enquiry form (src/assets/js), SEO (sitemap.xml, robots.txt, canonical,
noindex), _headers security file, check scripts (HTML validation, links, axe, 1.5 MB budget),
docs/decisions ADR-01..09 (ADR-02 = Eleventy), docs/open-decisions.md (OD-01..18), docs/runbook.md,
README, then PR into main and merge once build, tests and checks pass. Delete this file before merging.
