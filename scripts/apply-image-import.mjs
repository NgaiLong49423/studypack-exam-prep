import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const [batchInput, resolutionInput, mode] = process.argv.slice(2)
if (!batchInput || !resolutionInput || (mode !== undefined && mode !== '--write')) {
  console.error('Usage: node scripts/apply-image-import.mjs <clean-batch.json> <resolution.json> [--write]')
  process.exit(2)
}
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const batchFile = resolve(process.cwd(), batchInput)
const resolutionFile = resolve(process.cwd(), resolutionInput)
const planRun = spawnSync(process.execPath, [resolve(root, 'scripts', 'plan-image-import.mjs'), batchFile], { encoding: 'utf8' })
if (planRun.stderr) process.stderr.write(planRun.stderr)
if (planRun.status !== 0) process.exit(planRun.status ?? 1)
const plan = JSON.parse(planRun.stdout)
const batch = readJson(batchFile)
const resolution = readJson(resolutionFile)
const fail = (message) => { console.error(`Import was not applied: ${message}`); process.exit(1) }
const validId = (value) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
if (resolution.schemaVersion !== '1.0' || resolution.batchId !== batch.batchId || resolution.subjectId !== batch.subjectId || !Array.isArray(resolution.decisions)) fail('resolution must match the clean batch and contain decisions.')

const resolutionByOrder = new Map()
for (const decision of resolution.decisions) {
  if (!Number.isInteger(decision?.sourceOrder) || resolutionByOrder.has(decision.sourceOrder) || !['reuse', 'keep-separate', 'skip'].includes(decision.action)) fail('resolution decisions need unique sourceOrder and supported action.')
  resolutionByOrder.set(decision.sourceOrder, decision)
}
for (const sourceOrder of resolutionByOrder.keys()) {
  if (plan.decisions.find((decision) => decision.sourceOrder === sourceOrder)?.decision !== 'POSSIBLE_DUPLICATE') fail(`sourceOrder ${sourceOrder} does not require a duplicate resolution.`)
}

const subjectRoot = resolve(root, 'subjects', batch.subjectId)
const bankFile = resolve(subjectRoot, 'questions', 'questions.json')
const existingBank = existsSync(bankFile) ? readJson(bankFile) : { schemaVersion: '1.0', subjectId: batch.subjectId, version: 1, questions: [] }
if (!Array.isArray(existingBank.questions)) fail('existing question bank is invalid.')
const existingIds = new Set(existingBank.questions.map((question) => question.id))
const nextQuestionId = (() => {
  const prefix = `${batch.subjectId}-q-`
  const highest = existingBank.questions.reduce((max, question) => {
    const value = question.id?.startsWith(prefix) ? Number(question.id.slice(prefix.length)) : Number.NaN
    return Number.isInteger(value) ? Math.max(max, value) : max
  }, 0)
  let value = highest + 1
  return () => `${prefix}${String(value++).padStart(4, '0')}`
})()
const questionIdByOrder = new Map()
const newQuestions = []
for (const decision of plan.decisions) {
  if (decision.decision === 'EXACT_DUPLICATE') { questionIdByOrder.set(decision.sourceOrder, decision.questionId); continue }
  const userDecision = resolutionByOrder.get(decision.sourceOrder)
  if (decision.decision === 'POSSIBLE_DUPLICATE') {
    if (!userDecision) fail(`sourceOrder ${decision.sourceOrder} needs a resolution for POSSIBLE_DUPLICATE.`)
    if (userDecision.action === 'skip') fail(`sourceOrder ${decision.sourceOrder} was skipped. Remove it from the source batch before applying a complete import.`)
    if (userDecision.action === 'reuse') {
      if (!validId(userDecision.questionId) || !decision.candidateQuestionIds?.includes(userDecision.questionId) || !existingIds.has(userDecision.questionId)) fail(`sourceOrder ${decision.sourceOrder} can only reuse a listed candidate Question.`)
      questionIdByOrder.set(decision.sourceOrder, userDecision.questionId)
      continue
    }
  } else if (userDecision) {
    fail(`sourceOrder ${decision.sourceOrder} is NEW_QUESTION and must not have a resolution.`)
  }
  const item = batch.items.find((candidate) => candidate.sourceOrder === decision.sourceOrder)
  const questionId = nextQuestionId()
  const optionIdByLabel = new Map(item.options.map((option, index) => [option.sourceLabel, `opt-${index + 1}`]))
  newQuestions.push({
    id: questionId, subjectId: batch.subjectId, version: 1, blocks: item.stemBlocks,
    options: item.options.map((option) => ({ id: optionIdByLabel.get(option.sourceLabel), blocks: option.blocks })),
    correctAnswerIds: item.answer.sourceLabels.map((label) => optionIdByLabel.get(label)),
    maxSelections: item.maxSelections, explanation: item.explanation, topicIds: item.topicIds,
    active: true, sourceRef: { batchId: batch.batchId, fileName: item.sourceRef.fileName, pageIndex: item.sourceRef.pageIndex, region: item.sourceRef.region, sourceOrder: item.sourceOrder },
  })
  questionIdByOrder.set(decision.sourceOrder, questionId)
}

let exam = null
let examFile = null
if (batch.sourceKind === 'exam') {
  if (!validId(batch.examDraft.examIdHint) || typeof batch.examDraft.title !== 'string' || batch.examDraft.title.trim().length === 0) fail('Exam apply needs a valid examIdHint and title.')
  examFile = resolve(subjectRoot, 'exams', `${batch.examDraft.examIdHint}.json`)
  if (existsSync(examFile)) fail(`Exam already exists: ${batch.examDraft.examIdHint}. Existing Exam files are never overwritten.`)
  exam = { schemaVersion: '1.0', examId: batch.examDraft.examIdHint, subjectId: batch.subjectId, title: batch.examDraft.title, status: 'draft', declaredQuestionCount: batch.items.length, sections: [], items: batch.items.map((item) => ({ examItemId: `${batch.examDraft.examIdHint}-item-${String(item.sourceOrder).padStart(3, '0')}`, order: item.sourceOrder, originalNumber: item.originalNumber, sectionId: null, questionId: questionIdByOrder.get(item.sourceOrder), questionVersion: 1 })) }
}

const result = { batchId: batch.batchId, mode: mode === '--write' ? 'applied-as-draft' : 'dry-run', reusedQuestionCount: plan.decisions.length - newQuestions.length, newQuestionCount: newQuestions.length, exam: exam ? { examId: exam.examId, createdExamItemCount: exam.items.length, status: 'draft' } : null, nextStep: 'Run content validation, review the new draft, then explicitly update catalog status/examIds to publish.' }
if (mode !== '--write') { console.log(JSON.stringify(result, null, 2)); process.exit(0) }

const writeAtomically = (file, value) => {
  const temp = `${file}.tmp-${process.pid}`
  writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  try { renameSync(temp, file) } finally { if (existsSync(temp)) unlinkSync(temp) }
}
mkdirSync(resolve(subjectRoot, 'questions'), { recursive: true })
if (examFile) mkdirSync(resolve(subjectRoot, 'exams'), { recursive: true })
writeAtomically(bankFile, { ...existingBank, questions: [...existingBank.questions, ...newQuestions] })
if (examFile) writeAtomically(examFile, exam)
console.log(JSON.stringify(result, null, 2))
