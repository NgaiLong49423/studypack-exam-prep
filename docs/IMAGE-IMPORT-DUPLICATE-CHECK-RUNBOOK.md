# Cross-batch duplicate check

Run this after every staging batch is clean and before applying the first batch
for a Subject:

```bash
node scripts/check-image-import-duplicates.mjs subjects/prj301/questions/prj301-batch-001.image-import.json subjects/prj301/questions/prj301-batch-002.image-import.json
```

Pass every clean batch for the Subject in source order. The command is read-only.

- `EXACT_DUPLICATE_IN_BATCH`: do not create a second Question; the single-batch
  planner reuses the Question created or reused by the earlier item.
- `EXACT_DUPLICATE_ACROSS_BATCHES`: do not create a second Question. During
  application, reuse the canonical Question created from the earlier item.
- `POSSIBLE_DUPLICATE_ACROSS_BATCHES`: decide manually whether to keep, merge,
  or exclude it before applying either item.

This check complements the single-batch planner, which now also catches exact
and possible duplicates inside one batch.
