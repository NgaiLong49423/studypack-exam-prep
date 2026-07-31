# Image Batch Validation Runbook

Use this pipeline after an LLM has converted source images into one
`ImageImportBatch` JSON file and before any Question Bank or Exam import.

```bash
node scripts/validate-image-import-batch.mjs path/to/batch.json
```

The batch is safe to pass to the import pipeline only when the command returns
`0 errors`. The validator checks the batch structure, known `subjectId`, source
order, option labels, answer evidence, review flags and declared Exam count.

It deliberately does not open source images, assign Question IDs, resolve
duplicates, write Question/Exam files or publish content. Fix the reported
field in the staging JSON, then run the command again. Keep raw source images
outside this repository.
