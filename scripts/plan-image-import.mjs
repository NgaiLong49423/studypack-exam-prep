import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const input = process.argv[2]
if (!input || process.argv.length !== 3) {
  console.error('Usage: node scripts/plan-image-import.mjs <validated-batch.json>')
  process.exit(2)
}

const batchFile = resolve(process.cwd(), input)
const validation = spawnSync(process.execPath, [resolve(root, 'scripts', 'validate-image-import-batch.mjs'), batchFile], { encoding: 'utf8' })
if (validation.stdout) process.stderr.write(validation.stdout)
if (validation.stderr) process.stderr.write(validation.stderr)
if (validation.status !== 0) {
  console.error('Import plan was not created because the staging batch is not ready.')
  process.exit(validation.status ?? 1)
}

const readJson = (file) => {
  if (!existsSync(file)) return null
  return JSON.parse(readFileSync(file, 'utf8'))
}
const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}_]+/gu, '')
const blockText = (blocks) => blocks.map((block) => block.text).join('\n')
const questionSignature = (question) => {
  const correctIds = new Set(question.correctAnswerIds)
  const options = question.options.map((option) => `${normalize(blockText(option.blocks))}:${correctIds.has(option.id) ? 'correct' : 'incorrect'}`).sort()
  return `${normalize(blockText(question.blocks))}|${question.maxSelections}|${options.join('|')}`
}
const batchItemSignature = (item) => {
  const correctLabels = new Set(item.answer.sourceLabels)
  const options = item.options.map((option) => `${normalize(blockText(option.blocks))}:${correctLabels.has(option.sourceLabel) ? 'correct' : 'incorrect'}`).sort()
  return `${normalize(blockText(item.stemBlocks))}|${item.maxSelections}|${options.join('|')}`
}
const batch = readJson(batchFile)
const bankFile = resolve(root, 'subjects', batch.subjectId, 'questions', 'questions.json')
const bank = readJson(bankFile)
const questions = (bank?.questions ?? []).filter((question) => question.active !== false)
const exactBySignature = new Map()
const questionsByStem = new Map()
for (const question of questions) {
  const signature = questionSignature(question)
  exactBySignature.set(signature, [...(exactBySignature.get(signature) ?? []), question])
  const stem = normalize(blockText(question.blocks))
  questionsByStem.set(stem, [...(questionsByStem.get(stem) ?? []), question])
}

const plannedExactBySignature = new Map()
const plannedByStem = new Map()
const decisions = batch.items.map((item, index) => {
  const signature = batchItemSignature(item)
  const exactMatches = exactBySignature.get(signature) ?? []
  const stemMatches = questionsByStem.get(normalize(blockText(item.stemBlocks))) ?? []
  const base = { sourceOrder: item.sourceOrder, originalNumber: item.originalNumber, sourceFile: item.sourceRef.fileName, field: `items[${index}]` }
  if (exactMatches.length > 0) return { ...base, decision: 'EXACT_DUPLICATE', questionId: exactMatches[0].id, questionVersion: exactMatches[0].version, candidateQuestionIds: exactMatches.map((question) => question.id) }
  const plannedExact = plannedExactBySignature.get(signature)
  if (plannedExact) return { ...base, decision: 'EXACT_DUPLICATE_IN_BATCH', reusesSourceOrder: plannedExact.sourceOrder, reusesSourceFile: plannedExact.sourceFile }
  const plannedStem = plannedByStem.get(normalize(blockText(item.stemBlocks)))
  if (stemMatches.length > 0) return { ...base, decision: 'POSSIBLE_DUPLICATE', candidateQuestionIds: stemMatches.map((question) => question.id), actionRequired: 'Choose merge, keepSeparate or skip before applying import.' }
  if (plannedStem) return { ...base, decision: 'POSSIBLE_DUPLICATE_IN_BATCH', candidateSourceOrders: [plannedStem.sourceOrder], actionRequired: 'Resolve against the earlier item in this batch before applying import.' }
  plannedExactBySignature.set(signature, base)
  plannedByStem.set(normalize(blockText(item.stemBlocks)), base)
  return { ...base, decision: 'NEW_QUESTION', actionRequired: 'Create a new Question only in the apply-import pipeline.' }
})

const possibleCount = decisions.filter((decision) => decision.decision === 'POSSIBLE_DUPLICATE' || decision.decision === 'POSSIBLE_DUPLICATE_IN_BATCH').length
const report = {
  schemaVersion: '1.0',
  batchId: batch.batchId,
  subjectId: batch.subjectId,
  sourceKind: batch.sourceKind,
  status: possibleCount > 0 ? 'needs-review' : 'ready-for-apply',
  summary: {
    sourceItemCount: decisions.length,
    exactDuplicateCount: decisions.filter((decision) => decision.decision === 'EXACT_DUPLICATE' || decision.decision === 'EXACT_DUPLICATE_IN_BATCH').length,
    possibleDuplicateCount: decisions.filter((decision) => decision.decision === 'POSSIBLE_DUPLICATE' || decision.decision === 'POSSIBLE_DUPLICATE_IN_BATCH').length,
    newQuestionCount: decisions.filter((decision) => decision.decision === 'NEW_QUESTION').length,
  },
  exam: batch.sourceKind === 'exam' ? {
    examIdHint: batch.examDraft.examIdHint,
    title: batch.examDraft.title,
    declaredQuestionCount: batch.examDraft.declaredQuestionCount,
    createdExamItemCount: decisions.length,
  } : null,
  decisions,
  scopeNote: 'This is a read-only plan. It does not assign IDs, merge duplicates, write content or publish an Exam.',
}
console.log(JSON.stringify(report, null, 2))
