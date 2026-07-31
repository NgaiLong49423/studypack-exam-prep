# Image Import Apply Runbook

Pipeline 4 is the only pipeline that can write canonical Subject content. It
requires a clean batch. A resolution file conforming to
`schemas/image-import-resolution.schema.json` is required only when the plan
contains a `POSSIBLE_DUPLICATE`.

```bash
# Preview only; no files are changed.
node scripts/apply-image-import.mjs path/to/clean-batch.json

# Create new Questions and, for an Exam batch, a draft Exam.
node scripts/apply-image-import.mjs path/to/clean-batch.json --write
```

`EXACT_DUPLICATE` is reused automatically. Every `POSSIBLE_DUPLICATE` must have
one resolution: `reuse` with a listed `questionId`, or `keep-separate`. Pass
that resolution file before `--write`. `skip` is rejected for a complete import
so an Exam never loses a source position.

The writer refuses to overwrite an Exam. It only creates `draft` content and
never changes `subjects/index.json` to publish a Subject or Exam. Review the
draft, run `node scripts/validate-content.mjs`, then make a separate explicit
publish change after the data is approved.
