import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const inputs = process.argv.slice(2)
if (inputs.length < 2) {
  console.error('Usage: node scripts/check-image-import-duplicates.mjs <clean-batch-a.json> <clean-batch-b.json> [...]')
  process.exit(2)
}
const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}_]+/gu, '')
const blockText = (blocks) => blocks.map((block) => block.text).join('\n')
const signature = (item) => {
  const answers = new Set(item.answer.sourceLabels)
  const options = item.options.map((option) => `${normalize(blockText(option.blocks))}:${answers.has(option.sourceLabel) ? 'correct' : 'incorrect'}`).sort()
  return `${normalize(blockText(item.stemBlocks))}|${item.maxSelections}|${options.join('|')}`
}
const batches = inputs.map((input) => {
  const file = resolve(process.cwd(), input)
  const validation = spawnSync(process.execPath, [resolve(root, 'scripts', 'validate-image-import-batch.mjs'), file], { encoding: 'utf8' })
  if (validation.stdout) process.stderr.write(validation.stdout)
  if (validation.stderr) process.stderr.write(validation.stderr)
  if (validation.status !== 0) process.exit(validation.status ?? 1)
  return { file: input, batch: JSON.parse(readFileSync(file, 'utf8')) }
})
const subjectId = batches[0].batch.subjectId
if (batches.some(({ batch }) => batch.subjectId !== subjectId)) {
  console.error('All batches must belong to one Subject.')
  process.exit(2)
}

const exact = new Map()
const stems = new Map()
const duplicates = []
for (const { file, batch } of batches) {
  for (const item of batch.items) {
    const entry = { batchId: batch.batchId, file, sourceOrder: item.sourceOrder, originalNumber: item.originalNumber, sourceFile: item.sourceRef.fileName }
    const itemSignature = signature(item)
    const stem = normalize(blockText(item.stemBlocks))
    if (exact.has(itemSignature)) {
      const matches = exact.get(itemSignature)
      duplicates.push({ type: matches.some((match) => match.batchId === batch.batchId) ? 'EXACT_DUPLICATE_IN_BATCH' : 'EXACT_DUPLICATE_ACROSS_BATCHES', item: entry, matches })
    } else if (stems.has(stem)) {
      const matches = stems.get(stem)
      duplicates.push({ type: matches.some((match) => match.batchId === batch.batchId) ? 'POSSIBLE_DUPLICATE_IN_BATCH' : 'POSSIBLE_DUPLICATE_ACROSS_BATCHES', item: entry, matches })
    }
    exact.set(itemSignature, [...(exact.get(itemSignature) ?? []), entry])
    stems.set(stem, [...(stems.get(stem) ?? []), entry])
  }
}
const exactCount = duplicates.filter((duplicate) => duplicate.type.startsWith('EXACT_')).length
console.log(JSON.stringify({ schemaVersion: '1.0', subjectId, batchCount: batches.length, itemCount: batches.reduce((count, { batch }) => count + batch.items.length, 0), status: duplicates.some((duplicate) => duplicate.type.startsWith('POSSIBLE_')) ? 'needs-review' : 'ready-for-sequential-apply', summary: { exactDuplicateCount: exactCount, possibleDuplicateCount: duplicates.length - exactCount }, duplicates, scopeNote: 'Run this over every clean staging batch before applying any of them. Exact duplicates must reuse the first canonical Question created from the matching earlier item.' }, null, 2))
