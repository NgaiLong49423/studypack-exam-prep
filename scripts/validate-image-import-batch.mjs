import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const errors = []
const warnings = []
const infos = []
const validId = (value) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
const add = (severity, code, field, message) => ({ error: errors, warning: warnings, info: infos }[severity]).push({ severity, code, field, message })
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0
const positiveInteger = (value) => Number.isInteger(value) && value >= 1
const readJson = (file, field) => {
  if (!existsSync(file)) { add('error', 'CONTENT_FILE_MISSING', field, `File does not exist: ${file}`); return null }
  try { return JSON.parse(readFileSync(file, 'utf8')) } catch { add('error', 'CONTENT_JSON_INVALID', field, `File is not valid JSON: ${file}`); return null }
}
const validBlocks = (blocks, field) => Array.isArray(blocks) && blocks.length > 0 && blocks.every((block) => isObject(block) && block.type === 'markdown' && nonEmpty(block.text))
const reportEmbeddedIssues = (issues, field) => {
  if (!Array.isArray(issues)) { add('error', 'BATCH_ISSUES_INVALID', field, 'issues must be an array.'); return }
  for (const [index, issue] of issues.entries()) {
    const issueField = `${field}[${index}]`
    if (!isObject(issue) || !['error', 'warning', 'info'].includes(issue.severity) || !/^[A-Z][A-Z0-9_]*$/.test(issue.code) || !nonEmpty(issue.message)) {
      add('error', 'BATCH_ISSUE_INVALID', issueField, 'Issue needs severity, stable uppercase code and message.'); continue
    }
    add(issue.severity, issue.code, issue.field ?? issueField, issue.message)
  }
}

const input = process.argv[2]
if (!input || process.argv.length !== 3) {
  console.error('Usage: node scripts/validate-image-import-batch.mjs <path-to-batch.json>')
  process.exit(2)
}
{
  const batchFile = resolve(process.cwd(), input)
  const batch = readJson(batchFile, 'batch')
  const catalog = readJson(resolve(root, 'subjects', 'index.json'), 'subjects/index.json')
  const subjectIds = new Set(Array.isArray(catalog?.subjects) ? catalog.subjects.map((subject) => subject.subjectId) : [])

  if (batch) {
    if (batch.schemaVersion !== '1.0' || !validId(batch.batchId) || !validId(batch.subjectId) || !['question-bank', 'exam'].includes(batch.sourceKind) || !Array.isArray(batch.items)) add('error', 'BATCH_SCHEMA_INVALID', 'batch', 'Batch needs schemaVersion 1.0, valid IDs, sourceKind and items array.')
    if (!subjectIds.has(batch.subjectId)) add('error', 'BATCH_SUBJECT_NOT_FOUND', 'subjectId', 'subjectId must exist in subjects/index.json.')
    const isExam = batch.sourceKind === 'exam'
    if (isExam && (!isObject(batch.examDraft) || (batch.examDraft.examIdHint !== null && !validId(batch.examDraft.examIdHint)) || (batch.examDraft.title !== null && !nonEmpty(batch.examDraft.title)) || (batch.examDraft.declaredQuestionCount !== null && !positiveInteger(batch.examDraft.declaredQuestionCount)))) add('error', 'BATCH_EXAM_DRAFT_INVALID', 'examDraft', 'Exam batch needs a valid examDraft; unknown values must be null.')
    if (!isExam && batch.examDraft !== null) add('error', 'BATCH_EXAM_DRAFT_UNEXPECTED', 'examDraft', 'question-bank batch must set examDraft to null.')
    reportEmbeddedIssues(batch.batchIssues, 'batchIssues')

    const sourceOrders = new Set()
    for (const [index, item] of (batch.items ?? []).entries()) {
      const field = `items[${index}]`
      if (!isObject(item)) { add('error', 'BATCH_ITEM_INVALID', field, 'Item must be an object.'); continue }
      if (!isObject(item.sourceRef) || !nonEmpty(item.sourceRef.fileName) || !positiveInteger(item.sourceRef.pageIndex) || (item.sourceRef.region !== null && !nonEmpty(item.sourceRef.region))) add('error', 'BATCH_SOURCE_REF_INVALID', `${field}.sourceRef`, 'sourceRef needs fileName, pageIndex and nullable region.')
      if (!positiveInteger(item.sourceOrder) || sourceOrders.has(item.sourceOrder)) add('error', 'BATCH_SOURCE_ORDER_INVALID', `${field}.sourceOrder`, 'sourceOrder must be unique positive integer.')
      sourceOrders.add(item.sourceOrder)
      if (item.originalNumber !== null && !positiveInteger(item.originalNumber)) add('error', 'BATCH_ORIGINAL_NUMBER_INVALID', `${field}.originalNumber`, 'originalNumber must be a positive integer or null.')
      if (!validBlocks(item.stemBlocks, `${field}.stemBlocks`)) add('error', 'BATCH_STEM_INVALID', `${field}.stemBlocks`, 'Question needs at least one non-empty markdown block.')
      if (!Array.isArray(item.options) || item.options.length === 0) add('error', 'BATCH_OPTIONS_MISSING', `${field}.options`, 'Question needs at least one option.')
      const labels = (item.options ?? []).map((option) => option?.sourceLabel)
      if (labels.some((label) => !nonEmpty(label)) || new Set(labels).size !== labels.length) add('error', 'BATCH_OPTION_LABEL_INVALID', `${field}.options`, 'Option source labels must be non-empty and unique.')
      for (const [optionIndex, option] of (item.options ?? []).entries()) if (!isObject(option) || !validBlocks(option.blocks, `${field}.options[${optionIndex}].blocks`)) add('error', 'BATCH_OPTION_INVALID', `${field}.options[${optionIndex}]`, 'Option needs non-empty markdown blocks.')
      if (!positiveInteger(item.maxSelections) || item.maxSelections > (item.options?.length ?? 0)) add('error', 'BATCH_MAX_SELECTIONS_INVALID', `${field}.maxSelections`, 'maxSelections must be between 1 and option count.')
      if (!isObject(item.answer) || !['explicit', 'absent', 'unclear'].includes(item.answer.evidence) || !Array.isArray(item.answer.sourceLabels) || new Set(item.answer.sourceLabels).size !== item.answer.sourceLabels.length) add('error', 'BATCH_ANSWER_INVALID', `${field}.answer`, 'answer needs unique sourceLabels and supported evidence.')
      else if (item.answer.evidence === 'explicit' && (item.answer.sourceLabels.length === 0 || item.answer.sourceLabels.some((label) => !labels.includes(label)))) add('error', 'BATCH_ANSWER_REFERENCE_INVALID', `${field}.answer.sourceLabels`, 'Explicit answer labels must exist in options.')
      else if (item.answer.evidence === 'explicit' && item.answer.sourceLabels.length > item.maxSelections) add('error', 'BATCH_ANSWER_SELECTIONS_INVALID', `${field}.answer.sourceLabels`, 'Correct answer count cannot exceed maxSelections.')
      else if (item.answer.evidence !== 'explicit' && item.answer.sourceLabels.length > 0) add('error', 'BATCH_ANSWER_EVIDENCE_INVALID', `${field}.answer`, 'Only explicit evidence can contain answer labels.')
      if (item.answer?.evidence !== 'explicit' || item.needsReview === true) add('error', 'BATCH_ITEM_NOT_READY', field, 'Item still needs review or lacks an explicit source answer.')
      if (typeof item.extractionConfidence !== 'number' || item.extractionConfidence < 0 || item.extractionConfidence > 1 || typeof item.needsReview !== 'boolean' || !Array.isArray(item.topicIds)) add('error', 'BATCH_ITEM_METADATA_INVALID', field, 'Item confidence, needsReview and topicIds are invalid.')
      else if (new Set(item.topicIds).size !== item.topicIds.length || item.topicIds.some((topicId) => !nonEmpty(topicId))) add('error', 'BATCH_TOPIC_IDS_INVALID', `${field}.topicIds`, 'topicIds must contain unique non-empty strings.')
      if (item.explanation !== null && (!isObject(item.explanation) || !validBlocks(item.explanation.blocks, `${field}.explanation.blocks`))) add('error', 'BATCH_EXPLANATION_INVALID', `${field}.explanation`, 'Explanation must be null or contain non-empty markdown blocks.')
      reportEmbeddedIssues(item.issues, `${field}.issues`)
    }
    if (sourceOrders.size === (batch.items?.length ?? 0) && [...sourceOrders].some((value) => value > sourceOrders.size)) add('error', 'BATCH_SOURCE_ORDER_GAP', 'items', 'sourceOrder must be continuous from 1 to item count.')
    if (isExam && batch.examDraft?.declaredQuestionCount !== null && batch.examDraft?.declaredQuestionCount !== batch.items?.length) add('error', 'BATCH_DECLARED_COUNT_MISMATCH', 'examDraft.declaredQuestionCount', 'Declared question count must equal item count before import.')
  }
}

for (const result of [...errors, ...warnings, ...infos]) console.log(`${result.severity.toUpperCase()} ${result.code} ${result.field}: ${result.message}`)
console.log(`Image batch validation: ${errors.length} error(s), ${warnings.length} warning(s), ${infos.length} info(s).`)
process.exitCode = errors.length ? 1 : 0
