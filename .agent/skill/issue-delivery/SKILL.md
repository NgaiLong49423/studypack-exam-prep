---
name: issue-delivery
description: Implement a StudyPack GitHub Issue as a small, verified vertical slice with explicit scope, contract checks and a review-ready pull request. Use when coding from an accepted issue.
---

# StudyPack Issue Delivery

Use this skill only after an issue is accepted for implementation.

## Before coding

1. Read the issue completely: goal, acceptance criteria, labels, linked contracts and out-of-scope notes.
2. Read `AGENTS.md` and `.agent/repo-contract.yml`.
3. Identify the narrowest files and tests that prove the behavior.
4. If the issue is vague or conflicts with a contract, stop and request clarification rather than inventing a product rule.

## Implementation

1. Work on `agent/<short-description>` from current `main`.
2. Deliver one coherent vertical slice; do not combine opportunistic refactors.
3. For user-facing changes, load and follow `ui-ux-quality`.
4. Preserve the V1 boundaries: static Pages app, browser-local progress, no backend, no AI API.
5. Keep Question, Exam and ExamItem identity/version behavior consistent with `docs/DATA-CONTRACT.md`.

## Verification and handoff

1. Run the quality gates specified in `.agent/repo-contract.yml` that apply to the change.
2. Inspect the final diff for generated files, secrets, private study data and unrelated edits.
3. In the draft PR, link the issue, list acceptance criteria satisfied, list commands run and honestly call out skipped checks.
4. Do not merge, rewrite history or change deployment settings without explicit approval.
