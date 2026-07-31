import JSZip from 'jszip'
import { learningStatus } from './statistics'
import type { AttemptRecord, Exam, Question, Subject } from './types'

type ExportContext = { subjectId: string; generatedAt: string; snapshotId: string }
type NotebookDocuments = { subjectContext: string; tutorRules: string }

const textOf = (blocks: { text: string }[]) => blocks.map((block) => block.text).join('\n')

function metadata(type: string, context: ExportContext) {
  return `Document type: ${type}\nExport format version: 1.0\nSubject ID: ${context.subjectId}\nGenerated at: ${context.generatedAt}\nSnapshot ID: ${context.snapshotId}`
}

export function createExportContext(subjectId: string, generatedAt = new Date().toISOString()): ExportContext {
  return { subjectId, generatedAt, snapshotId: `${subjectId}-${generatedAt.replace(/[:.]/g, '-')}` }
}

export function subjectContextMarkdown(subject: Subject, notebook: NotebookDocuments, context: ExportContext) {
  return `${metadata('subject-context', context)}\n\n# Subject Context — ${subject.code}\n\n- Subject ID: ${subject.subjectId}\n- Name: ${subject.name}\n- Description: ${subject.description}\n\n## Subject notes\n\n${notebook.subjectContext.trim() || 'Chưa có thông tin bối cảnh môn học.'}\n\n## Tutor rules\n\n${notebook.tutorRules.trim() || 'Chưa có quy tắc tutor riêng.'}\n`
}

export function questionBankMarkdown(questions: Question[], exams: Exam[], context: ExportContext) {
  const appearances = new Map<string, string[]>()
  exams.forEach((exam) => exam.items.forEach((item) => appearances.set(item.questionId, [...(appearances.get(item.questionId) ?? []), `${exam.title} — Question ${item.order}`])))
  const activeQuestions = Array.from(new Map(questions.filter((question) => question.active).map((question) => [question.id, question])).values())
  const entries = activeQuestions.map((question) => {
    const sourceAppearances = appearances.get(question.id) ?? []
    const options = question.options.map((option, index) => `${index + 1}. \`[${option.id}]\` ${textOf(option.blocks)}`).join('\n')
    const correct = question.options.filter((option) => question.correctAnswerIds.includes(option.id)).map((option) => `- \`[${option.id}]\` — ${textOf(option.blocks)}`).join('\n')
    return `## Question [${question.id}]\n\n- Current version: ${question.version}\n- Topics: Chưa phân loại\n\n### Source appearances\n\n${sourceAppearances.length ? sourceAppearances.map((appearance) => `- ${appearance}`).join('\n') : '- Chưa xuất hiện trong đề đã import'}\n\n### Question content\n\n${textOf(question.blocks)}\n\n### Options\n\n${options}\n\n### Correct answer\n\n${correct}\n\n### Official explanation\n\n${question.explanation ? textOf(question.explanation.blocks) : 'Chưa có lời giải'}`
  })
  return `${metadata('question-bank', context)}\n\n# Question Bank — ${context.subjectId}\n\n${entries.join('\n\n')}\n`
}

export function learningProgressMarkdown(subject: Subject, questions: Question[], attempts: AttemptRecord[], context: ExportContext) {
  const activeQuestions = questions.filter((question) => question.active)
  const histories = new Map<string, AttemptRecord[]>()
  attempts.forEach((attempt) => histories.set(attempt.questionId, [...(histories.get(attempt.questionId) ?? []), attempt]))
  const counts = { not_practiced: 0, learning: 0, weak: 0, developing: 0, stable: 0, mastered: 0 }
  activeQuestions.forEach((question) => { counts[learningStatus(histories.get(question.id) ?? [])] += 1 })
  const correct = attempts.filter((attempt) => attempt.isCorrect).length
  const unanswered = attempts.filter((attempt) => attempt.selectedOptionId === null).length
  const incorrect = attempts.length - correct - unanswered
  const entries = activeQuestions.map((question) => {
    const history = histories.get(question.id) ?? []
    const correctCount = history.filter((attempt) => attempt.isCorrect).length
    const unansweredCount = history.filter((attempt) => attempt.selectedOptionId === null).length
    const incorrectCount = history.length - correctCount - unansweredCount
    const latest = [...history].sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))[0]
    const lastResult = !latest ? 'not_practiced' : latest.selectedOptionId === null ? 'unanswered' : latest.isCorrect ? 'correct' : 'incorrect'
    const rate = history.length ? Math.round((correctCount / history.length) * 100) : 0
    return `### [${question.id}]\n\n- Study status: ${learningStatus(history)}\n- Attempt count: ${history.length}\n- Correct: ${correctCount}\n- Incorrect: ${incorrectCount}\n- Unanswered: ${unansweredCount}\n- Correct rate: ${rate}%\n- Frequency band: derived from study status\n- Last result: ${lastResult}\n- Last practiced at: ${latest?.answeredAt ?? 'Chưa làm'}`
  })
  return `${metadata('learning-progress', context)}\n\n# Learning Progress — ${subject.code}\n\n## Overall progress\n\n- Total active questions: ${activeQuestions.length}\n- Not practiced: ${counts.not_practiced}\n- Learning: ${counts.learning}\n- Weak: ${counts.weak}\n- Developing: ${counts.developing}\n- Stable: ${counts.stable}\n- Mastered: ${counts.mastered}\n- Total recorded attempts: ${attempts.length}\n- Correct: ${correct}\n- Incorrect: ${incorrect}\n- Unanswered: ${unanswered}\n- Overall correct rate: ${attempts.length ? Math.round((correct / attempts.length) * 100) : 0}%\n\n## Question progress\n\n${entries.join('\n\n')}\n`
}

export function examMarkdown(exam: Exam, context: ExportContext) {
  const items = exam.items.map((item) => `### Question ${item.order}\n\n- Exam item ID: ${item.examItemId}\n- Question ID: ${item.questionId}\n- Question version: ${item.questionVersion}\n- Original number: ${item.originalNumber}`).join('\n\n')
  return `${metadata('exam', context)}\n\n# Exam — ${exam.title}\n\n- Exam ID: ${exam.examId}\n- Subject ID: ${context.subjectId}\n- Question count: ${exam.items.length}\n\n${items}\n`
}

export function guideMarkdown(context: ExportContext) {
  return `${metadata('gemini-guide', context)}\n\n# StudyPack Gemini Guide\n\n- \`subject-context.md\`: nhận diện môn và tutor rules.\n- \`question-bank.md\`: nguồn chính thức cho câu hỏi, đáp án và lời giải.\n- \`learning-progress.md\`: snapshot tiến độ chính thức do app tính.\n- \`exams/\`: cấu trúc các đề người học đã chọn.\n\n## Tutor rules\n\n1. Ưu tiên not_practiced, weak, learning rồi developing.\n2. Không chủ động hỏi stable hoặc mastered, trừ khi người học yêu cầu.\n3. Chỉ hỏi một Question mỗi lượt và không lặp questionId trong cùng chat nếu không được yêu cầu.\n4. Dùng Question Bank làm nguồn chính thức.\n5. Kết quả chat không thay đổi progress trong app.\n6. Nếu theory người học thêm mâu thuẫn với Question Bank, ưu tiên Question Bank và nói rõ mâu thuẫn.\n`
}

export async function fullGeminiPack(subject: Subject, questions: Question[], attempts: AttemptRecord[], exams: Exam[], selectedExams: Exam[], notebook: NotebookDocuments) {
  const context = createExportContext(subject.subjectId)
  const zip = new JSZip()
  zip.file('STUDYPACK-GEMINI-GUIDE.md', guideMarkdown(context))
  zip.file('subject-context.md', subjectContextMarkdown(subject, notebook, context))
  zip.file('question-bank.md', questionBankMarkdown(questions, exams, context))
  zip.file('learning-progress.md', learningProgressMarkdown(subject, questions, attempts, context))
  selectedExams.forEach((exam) => zip.file(`exams/${exam.examId}.md`, examMarkdown(exam, context)))
  return { filename: `studypack-${subject.subjectId}-${context.generatedAt.replace(/[:.]/g, '-')}.zip`, blob: await zip.generateAsync({ type: 'blob' }) }
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
