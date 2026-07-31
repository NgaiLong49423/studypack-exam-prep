# Image Import Plan Runbook

Run this only after the staging batch passes Pipeline 2.

```bash
node scripts/plan-image-import.mjs path/to/clean-batch.json
```

The command first re-runs staging validation, then prints a JSON plan. It is
read-only and compares against active Questions in the same Subject and against
earlier items in the same batch:

- `EXACT_DUPLICATE`: reuse the listed Question when the stem, options, correct
  answers and `maxSelections` match after safe normalization.
- `POSSIBLE_DUPLICATE`: same normalized stem but a meaningful difference;
  a person must choose `merge`, `keepSeparate` or `skip`.
- `EXACT_DUPLICATE_IN_BATCH`: an item exactly repeats an earlier item in this
  batch; it reuses the Question created or reused by that earlier item.
- `POSSIBLE_DUPLICATE_IN_BATCH`: two staging items have the same normalized
  stem but differ materially; clean up the batch before applying it.
- `NEW_QUESTION`: no candidate exists; it can be created only by Pipeline 4.

For an Exam batch, the plan also records the source-order count that will become
ExamItems. It never assigns Question IDs, writes JSON, resolves a possible
duplicate or publishes a Subject/Exam.
