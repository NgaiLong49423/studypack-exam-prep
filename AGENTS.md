# StudyPack Agent Guide

## Product boundaries

StudyPack is a static, subject-based multiple-choice exam-practice app deployed on GitHub Pages.

- The question bank and exams are shared public learning content.
- Each learner's progress stays in their own browser in V1.
- The app is the only official source of learning results.
- Gemini Notebook is optional: it reads exported learning documents and answers clipboard prompts. It never writes results back into the app.

Read `docs/PRODUCT-OVERVIEW.md`, `docs/DATA-CONTRACT.md`, and the relevant issue before implementation.

## Repository layout

- `app/` — React + TypeScript + Vite frontend.
- `subjects/` — versioned subject content; never put user-private learning profiles here.
- `docs/` — approved product and data contracts.
- `schemas/` — JSON Schema for content validation.
- `prompts/` — reusable Gemini prompt templates.
- `.agent/skill/` — project-local instructions for coding agents.
- `.github/` — issue forms, labels, CI and Pages deployment.

## Delivery workflow

1. Start from a GitHub Issue with acceptance criteria.
2. Create `agent/<short-description>` from current `main`.
3. Make the smallest coherent vertical slice.
4. Run the quality gates in `.agent/repo-contract.yml`.
5. Inspect the final diff for unrelated files, private data and secrets.
6. Open a draft PR that links the issue. Do not merge without approval.

## Guardrails

- Preserve Question, Exam and ExamItem semantics defined in `docs/DATA-CONTRACT.md`.
- Keep first-choice locking in Practice mode and revision-until-submit in Exam mode.
- Use the UI/UX skill for learner-facing interface work.
- Use the issue-delivery skill when implementing a GitHub Issue.
- Do not introduce a backend, authentication, database or AI API without explicit approval.

## Content review communication

- A marked answer in a source image is evidence of what the source says, not a
  guarantee that the answer is factually correct.
- Agents must distinguish image-reading confidence from knowledge correctness.
  They may research independent evidence, but must state uncertainty and never
  silently change an answer.
- When asking the user to review content, explain the problem and its effect in
  ordinary language. If a technical field or property is mentioned, explain
  what it controls and why it matters. Offer clear decisions (keep, change,
  defer or drop), wait for the user's choice, and apply agreed data changes only
  after the review round is complete unless the user explicitly asks for an
  immediate single-item change.
- Every review message must include the source image filename and its page or
  region when available, so the user can open the exact image and compare it.
- The image-to-JSON LLM must audit every file in the input archive. It may repair
  clearly evidenced OCR or structural errors, but must record before/after,
  reason, location and `needsReview` in `repairLog`; repairs that may change
  meaning or the answer remain for human review.
