# ADR-03: Content editing tool

| | |
| --- | --- |
| Status | Proposed — waits for OD-05 (and a one-day trial). A Git-based CMS is preferred |
| Owner | Developer; Director approves |
| Source | Doc 07 Q07, Q21, Q37, ADR register; SRS C-08, C-09, FEAT-006; Doc 05 Q13; Doc 08 Q05, Q36 |

## Context

Staff must publish without a developer (FEAT-006). They need drafts, review, simple forms for notices
and image upload (Doc 07 register). Per-type permissions are needed: only admissions may publish
merit lists (Doc 05 Q13; Doc 08 Q40). Options:

- A Git-based editor, for example Decap CMS or Pages CMS.
- Editing files directly on GitHub.

Which tool is used also shapes the content file format (Doc 08 Q05).

## Decision

Not made. OD-05 (admin and content-editing tool: developer, approved by the Director, before
development) is open.

Meanwhile the content is plain files that any Git-based CMS can edit:

- Markdown with front matter in `src/content/programs`, `src/content/notices` and `src/content/news`;
- YAML in `src/_data/`.

Drafts use `status: Draft` and are never built (Doc 05 Q29). The build validates every file, so a
tool's mistakes fail the build instead of publishing.

## Consequences

- No CMS configuration is in the repo yet. Until OD-05 is decided, content changes are commits by the
  developer (Doc 07 inventory: "If down, developer edits files directly").
- The trial must check per-type permissions and two-factor sign-in (SRS C-08/C-09; Doc 07 Q21). If a
  tool cannot restrict merit lists to admissions, the rule is enforced by review instead.
- Staff identity (ADR-09) follows from this choice.
