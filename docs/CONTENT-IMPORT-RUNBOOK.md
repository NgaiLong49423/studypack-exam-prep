# Content Import Runbook

Use this workflow whenever adding a real Subject, Question Bank or Exam.

1. Add the Subject as `draft` in `subjects/index.json` and create `subject.json`.
2. Keep raw source material outside the repository; create normalized Question/Exam JSON only after review.
3. Run `node scripts/validate-content.mjs` from the repository root.
4. Resolve every `ERROR` code. Do not publish an Exam or Subject while validation fails.
5. Run duplicate review according to `EXAM-IMPORT-CONTRACT.md`.
6. Add only published Exam IDs to `subjects/index.json`, then publish the Subject when its bank is valid.
7. Run app tests and build before opening the data PR.

The validator is deterministic and reports stable error codes. It never edits, deletes or merges content automatically.
