import type { AttemptRecord, Exam, ExamItem, Question } from './types'

export type ResolvedExamItem = { item: ExamItem; question: Question }

export function resolveExamItems(exam: Exam, questions: Question[]): ResolvedExamItem[] {
  const byId = new Map(questions.map((question) => [question.id, question]))
  return exam.items.flatMap((item) => {
    const question = byId.get(item.questionId)
    return question ? [{ item, question }] : []
  })
}

export function examScore(answers: Record<string, string>, items: ResolvedExamItem[]) {
  const correct = items.filter(({ item, question }) => answers[item.examItemId] === question.correctAnswerIds[0]).length
  const unanswered = items.filter(({ item }) => !answers[item.examItemId]).length
  return { correct, unanswered, percent: items.length ? Math.round((correct / items.length) * 100) : 0 }
}

export function examAttempts(exam: Exam, items: ResolvedExamItem[], answers: Record<string, string>, answeredAt: string): AttemptRecord[] {
  return items.map(({ item, question }) => {
    const selectedOptionId = answers[item.examItemId] ?? null
    return {
      questionId: question.id,
      questionVersion: item.questionVersion,
      selectedOptionId,
      isCorrect: selectedOptionId === question.correctAnswerIds[0],
      answeredAt,
      source: 'exam',
      examId: exam.examId,
      examItemId: item.examItemId,
    }
  })
}
