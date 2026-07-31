# StudyPack Exam Prep

StudyPack is a focused web app for practicing subject-based multiple-choice exam banks. It will be published through GitHub Pages so classmates can use the same question bank while keeping their own progress in their browser.

## V1 product scope

- Select a subject and start Practice or Exam mode.
- Practice locks the first answer; Exam lets the learner revise until submission.
- Show explanations after an answer or submission.
- Track learner progress locally in the browser and surface it in Statistics.
- Export versioned Markdown learning documents for Gemini Notebook. The app remains the official source of progress.

## Repository layout

```text
app/          React + TypeScript + Vite application
subjects/     Versioned question banks and exams
docs/         Product, data and Gemini-export contracts
schemas/      Content-validation schemas
prompts/      Reusable Gemini prompt templates
.agent/skill/ Project-local agent skills
.github/      Issue forms, CI and GitHub Pages deployment
```

## Local development

```bash
cd app
npm install
npm run dev
```

## Quality checks

```bash
npm run lint --prefix app
npm run test --prefix app -- --run
npm run build --prefix app
node scripts/validate-content.mjs
node scripts/validate-image-import-batch.mjs path/to/batch.json
node scripts/plan-image-import.mjs path/to/clean-batch.json
node scripts/apply-image-import.mjs path/to/clean-batch.json path/to/resolution.json
```

## Key documents

- [Product overview](docs/PRODUCT-OVERVIEW.md)
- [Data contract](docs/DATA-CONTRACT.md)
- [Gemini export contract](docs/GEMINI-EXPORT-CONTRACT.md)
- [Contribution workflow](CONTRIBUTING.md)

Do not commit personal learning profiles, credentials or private source material.
