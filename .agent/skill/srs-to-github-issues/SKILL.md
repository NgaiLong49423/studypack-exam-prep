---
name: srs-to-github-issues
description: Turn approved StudyPack product and data contracts into small, traceable GitHub Issue drafts with testable acceptance criteria. Use when planning the backlog or preparing an issue for agent implementation.
---

# StudyPack Contracts to GitHub Issues

Use this skill to prepare work, not to code it. Default output is an issue draft; create a real GitHub Issue only when the user explicitly authorizes it.

## Sources of truth

Read the smallest relevant set first:

- `docs/PRODUCT-OVERVIEW.md` for learner outcomes and scope.
- `docs/DATA-CONTRACT.md` for Question, Exam and ExamItem behavior.
- `docs/GEMINI-EXPORT-CONTRACT.md` for Gemini export boundaries.
- `schemas/` and `subjects/` when data changes are involved.
- `AGENTS.md` and `.agent/repo-contract.yml` for delivery boundaries.

## Drafting procedure

1. Extract one learner outcome or one technical enabler; do not bundle unrelated work.
2. State the proposed labels: exactly one `type:*`, at least one `area:*`, one priority, then `status:ready-for-agent` when complete.
3. Write a concise issue with these sections: outcome, scope, acceptance criteria, contracts/data affected, verification and out of scope.
4. Acceptance criteria must be observable. Include mobile/responsive and empty/error states for UI work; include identity/version and privacy checks for data work.
5. Flag unclear product decisions as questions. Never invent a rule that conflicts with the contracts.

## Ready-for-agent standard

An issue is ready only when a coding agent can identify:

- the learner or maintainer outcome;
- affected files/contracts;
- clear acceptance criteria;
- verification commands or manual checks;
- work deliberately deferred.

Use `issue-delivery` only after the issue is accepted for implementation.
