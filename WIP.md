# Work in progress (handover)

This branch was started in a cloud session and is continuing in Claude Code on the developer's computer.

Done and committed:
- holding/ — M0 holding page (single file)
- package.json scripts, .editorconfig, .env.example
- functions/ — host-neutral enquiry function, mock adapters, 44 passing tests (`npm test`)
- lib/content-rules.js — intake badges, notice archiving, build-time content validation
- eleventy.config.js, src/_data/*, src/content/* (SAMPLE programs, notices, news), src/assets/css/main.css, src/assets/img/*
- docs/requirements/ — Docs 01–08 PDFs; docs/brand/ — logo banner source
- src/_includes: base, page, program, notice and news-post layouts; header with the full-screen
  menu (01–07); footer
- Home (src/index.njk) with the "students at work" 3D journey (src/scripts/3d/study-scene.js),
  posters, Lenis and GSAP (src/scripts/home.js), program cards 01–06, notices, campus, contact strip
- /programs/, /notices/ and 404 pages; esbuild bundling in eleventy.config.js
- docs/change-requests/CR-01-premium-3d-motion.md (3D/motion against NFR-PERF-01/02, Doc 06 Q27 type)
- Campus Explorer files kept in src/scripts/3d and src/assets/3d, not on Home (owner, 17 Oct 2026)

Still to do (user's brief, in order): the rest of the Doc 05 inventory (Admissions, Fees, About,
Affiliation, Faculty, News index, Contact, Enquire and Thank-you, Privacy, notices archive), browser
enquiry form (src/scripts), SEO (sitemap.xml, robots.txt), _headers security file (the one inline
script in base.njk needs its sha256 in the CSP), check scripts (HTML validation, links, axe, 1.5 MB budget),
docs/decisions ADR-01..09 (ADR-02 = Eleventy), docs/open-decisions.md (OD-01..18), docs/runbook.md,
README, then PR into main and merge once build, tests and checks pass. Delete this file before merging.
