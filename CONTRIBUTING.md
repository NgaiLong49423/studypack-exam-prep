# Contributing to StudyPack

## Delivery loop

1. Create or refine a GitHub Issue with a clear outcome and acceptance criteria.
2. Label it with one type, one area and one priority.
3. Create a branch named `agent/<short-description>` from `main`.
4. Implement only the scope accepted by the issue.
5. Run lint, tests and build from the repository contract.
6. Open a draft pull request that links the issue and states the verification result.
7. Merge only after review. Merging to `main` deploys the static app to GitHub Pages.

## Content and privacy

- Question-bank changes must preserve the schemas and contracts in `docs/`.
- Keep personal learning profiles and imported private study files out of Git.
- Do not add API keys or an AI API. Gemini Notebook integration in V1 is export-and-clipboard only.

## Issue quality

Use `.agent/skill/srs-to-github-issues/` to turn approved product documentation into well-scoped issue drafts. Use `.agent/skill/issue-delivery/` when implementing an accepted issue.
