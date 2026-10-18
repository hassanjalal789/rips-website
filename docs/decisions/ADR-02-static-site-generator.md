# ADR-02: Static site generator

| | |
| --- | --- |
| Status | Decided by the developer: Eleventy. Doc 07 v1.0 still lists this as "Not Decided — decide after a 1-day trial"; update the register |
| Owner | Developer (Doc 07 register) |
| Source | Doc 07 Q11, ADR register; Doc 08 Q07, Q12, Q16; build brief (October 2026); CR-01 |

## Context

Doc 07 Q11 asks for a static site generator that produces semantic HTML with minimal JavaScript. It
compares Eleventy, Astro, Hugo and hand-written HTML: all output plain HTML, and Eleventy and Astro fit
a JavaScript developer working in VS Code. ADR-02's owner is the developer. The developer's build brief
for this branch names Eleventy.

## Decision

Eleventy 3 with Nunjucks templates (`eleventy.config.js`).

- Content follows the Doc 08 content model: programs, notices and news are Markdown files with front
  matter (`src/content/`). Intakes, fee schedules, faculty and site settings are YAML (`src/_data/`).
- The build fails on a missing required field or an unknown program code (`lib/content-rules.js`,
  Doc 08 Q12, Q16).
- Browser scripts in `src/scripts/` are bundled by esbuild in Eleventy's `before` hook: ES modules,
  code-split and minified.
- The site uses no browser libraries. CR-01 had added three.js, GSAP and Lenis for a 3D Home;
  [CR-02](../change-requests/CR-02-photo-led-redesign.md) removed them. Design changes like these are
  recorded as change requests, not as ADRs.

## Consequences

- Changing generator later means re-templating, not rewriting content: the content stays plain files
  (Doc 07 register).
- Output in `_site/` is plain files, so any static host can serve it (ADR-04).
- Doc 07 Q11 asks for "minimal JavaScript", and Q25 for "build-time dependencies only". Since CR-02
  the only browser scripts are the site's own: the menu, the enquiry form and the list filters.
- One developer can run, build and check everything with Node (see `docs/runbook.md`).
