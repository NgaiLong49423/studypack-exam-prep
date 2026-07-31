import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const subjectsRoot = resolve(root, 'subjects')
const errors = []
const warnings = []
const issue = (severity, code, file, message) => (severity === 'error' ? errors : warnings).push({ severity, code, file, message })
const readJson = (file) => {
  if (!existsSync(file)) { issue('error', 'CONTENT_FILE_MISSING', file, 'Required content file is missing.'); return null }
  try { return JSON.parse(readFileSync(file, 'utf8')) } catch { issue('error', 'CONTENT_JSON_INVALID', file, 'File is not valid JSON.'); return null }
}
const validId = (value) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)

const catalogFile = resolve(subjectsRoot, 'index.json')
const catalog = readJson(catalogFile)
const subjectIds = new Set()

if (catalog?.schemaVersion !== '1.0' || !Array.isArray(catalog?.subjects)) issue('error', 'CATALOG_SCHEMA_INVALID', catalogFile, 'Catalog needs schemaVersion 1.0 and subjects array.')
for (const entry of catalog?.subjects ?? []) {
  const entryFile = `${catalogFile}#${entry?.subjectId ?? 'unknown'}`
  if (!validId(entry?.subjectId) || subjectIds.has(entry.subjectId)) { issue('error', 'CATALOG_SUBJECT_ID_INVALID', entryFile, 'Subject ID is missing, invalid or duplicated.'); continue }
  subjectIds.add(entry.subjectId)
  if (typeof entry.code !== 'string' || entry.code.length === 0 || typeof entry.name !== 'string' || entry.name.length === 0 || typeof entry.description !== 'string' || !['draft', 'published', 'archived'].includes(entry.status) || !Array.isArray(entry.examIds)) { issue('error', 'CATALOG_ENTRY_INVALID', entryFile, 'Catalog entry needs code, name, description, status and examIds.'); continue }
  if (new Set(entry.examIds).size !== entry.examIds.length) issue('error', 'CATALOG_EXAM_ID_DUPLICATE', entryFile, 'Catalog examIds must be unique.')
  const subjectFile = resolve(subjectsRoot, entry.subjectId, 'subject.json')
  const subject = readJson(subjectFile)
  if (!subject) continue
  if (subject.schemaVersion !== '1.0' || subject.subjectId !== entry.subjectId || subject.status !== entry.status || typeof subject.code !== 'string' || subject.code.length === 0 || typeof subject.name !== 'string' || subject.name.length === 0) issue('error', 'SUBJECT_CATALOG_MISMATCH', subjectFile, 'Subject metadata must match the catalog entry and include code and name.')
  if (entry.status === 'published' && (subject.aiTutor?.enabled !== true || subject.aiTutor?.provider !== 'gemini-notebook' || !validId(subject.aiTutor?.promptTemplateId))) issue('error', 'PUBLISHED_SUBJECT_AI_TUTOR_INVALID', subjectFile, 'Published Subject requires an enabled Gemini Notebook AI Tutor with a valid promptTemplateId.')
  const bankFile = resolve(subjectsRoot, entry.subjectId, 'questions', 'questions.json')
  const bank = existsSync(bankFile) ? readJson(bankFile) : null
  if (entry.status === 'published' && !bank) { issue('error', 'PUBLISHED_SUBJECT_BANK_MISSING', bankFile, 'Published subject requires a question bank.'); continue }
  if (!bank) continue
  if (bank.schemaVersion !== '1.0' || bank.subjectId !== entry.subjectId || !Array.isArray(bank.questions)) { issue('error', 'QUESTION_BANK_INVALID', bankFile, 'Question bank schemaVersion, subjectId or questions is invalid.'); continue }
  const questions = new Map()
  for (const question of bank.questions) {
    const questionFile = `${bankFile}#${question?.id ?? 'unknown'}`
    if (!validId(question?.id) || questions.has(question.id)) { issue('error', 'QUESTION_ID_INVALID', questionFile, 'Question ID is invalid or duplicated.'); continue }
    questions.set(question.id, question)
    if (question.subjectId !== entry.subjectId || !Array.isArray(question.blocks) || question.blocks.length === 0 || !Array.isArray(question.options) || question.options.length === 0) issue('error', 'QUESTION_STRUCTURE_INVALID', questionFile, 'Question needs matching subject, blocks and options.')
    const optionIds = question.options?.map((option) => option.id) ?? []
    if (optionIds.length !== new Set(optionIds).size) issue('error', 'QUESTION_OPTION_ID_DUPLICATE', questionFile, 'Option IDs must be unique.')
    if (!Number.isInteger(question.maxSelections) || question.maxSelections < 1 || question.maxSelections > optionIds.length) issue('error', 'QUESTION_MAX_SELECTIONS_INVALID', questionFile, 'maxSelections must be between 1 and the number of options.')
    if (!Array.isArray(question.correctAnswerIds) || question.correctAnswerIds.length < 1 || question.correctAnswerIds.length > question.maxSelections || question.correctAnswerIds.some((id) => !optionIds.includes(id)) || new Set(question.correctAnswerIds).size !== question.correctAnswerIds.length) issue('error', 'QUESTION_CORRECT_ANSWER_INVALID', questionFile, 'Correct answers must be unique existing options and cannot exceed maxSelections.')
  }
  for (const examId of entry.examIds ?? []) {
    if (!validId(examId)) { issue('error', 'CATALOG_EXAM_ID_INVALID', entryFile, 'Each catalog examId must be a valid ID.'); continue }
    const examFile = resolve(subjectsRoot, entry.subjectId, 'exams', `${examId}.json`)
    const exam = readJson(examFile)
    if (!exam) continue
    if (exam.schemaVersion !== '1.0' || exam.examId !== examId || exam.subjectId !== entry.subjectId || exam.status !== 'published' || !Array.isArray(exam.items) || exam.items.length === 0) { issue('error', 'EXAM_STRUCTURE_INVALID', examFile, 'Published exam metadata or items is invalid.'); continue }
    if (exam.declaredQuestionCount !== null && exam.declaredQuestionCount !== exam.items.length) issue('error', 'EXAM_COUNT_MISMATCH', examFile, 'Declared question count must equal item count.')
    const itemIds = new Set(); const orders = new Set()
    for (const item of exam.items) {
      if (!validId(item?.examItemId) || itemIds.has(item.examItemId) || !Number.isInteger(item.order) || orders.has(item.order)) issue('error', 'EXAM_ITEM_ID_OR_ORDER_INVALID', examFile, 'Exam item IDs and order must be unique.')
      itemIds.add(item.examItemId); orders.add(item.order)
      const question = questions.get(item.questionId)
      if (!question) issue('error', 'EXAM_QUESTION_REFERENCE_MISSING', examFile, `Exam item references missing question ${item.questionId}.`)
      else if (item.questionVersion !== question.version) issue('error', 'EXAM_QUESTION_VERSION_MISMATCH', examFile, `Exam item version does not match ${item.questionId}.`)
    }
  }
}

for (const result of [...errors, ...warnings]) console.log(`${result.severity.toUpperCase()} ${result.code} ${result.file}: ${result.message}`)
console.log(`Content validation: ${errors.length} error(s), ${warnings.length} warning(s).`)
process.exitCode = errors.length ? 1 : 0
