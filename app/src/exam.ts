import { gradeAnswer } from './practice'
import type { AttemptRecord, Exam, ExamItem, Question } from './types'

export type ResolvedExamItem = { item: ExamItem; question: Question }

export const MOCK_EXAM_MIN_QUESTION_COUNT = 30
export const MOCK_EXAM_MAX_QUESTION_COUNT = 50

export function createMockExam(subjectId: string, questions: Question[], requestedCount: number, createdAt = Date.now()): Exam {
  const uniqueActiveQuestions = Array.from(new Map(questions.filter((question) => question.active).map((question) => [question.id, question])).values())
  const count = Math.min(Math.max(MOCK_EXAM_MIN_QUESTION_COUNT, requestedCount), MOCK_EXAM_MAX_QUESTION_COUNT, uniqueActiveQuestions.length)
  const selected = [...uniqueActiveQuestions].sort(() => Math.random() - 0.5).slice(0, count)
  const examId = `mock-${subjectId}-${createdAt}`
  return {
    examId,
    title: `Thi thử ngẫu nhiên · ${selected.length} câu`,
    declaredQuestionCount: selected.length,
    items: selected.map((question, index) => ({ examItemId: `${examId}-item-${String(index + 1).padStart(3, '0')}`, order: index + 1, originalNumber: index + 1, questionId: question.id, questionVersion: question.version })),
  }
}

export function formatRemainingTime(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds)
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function resolveExamItems(exam: Exam, questions: Question[]): ResolvedExamItem[] {
  const byId = new Map(questions.map((question) => [question.id, question]))
  return exam.items.flatMap((item) => {
    const question = byId.get(item.questionId)
    return question ? [{ item, question }] : []
  })
}

export function examScore(answers: Record<string, string[]>, items: ResolvedExamItem[]) {
  const correct = items.filter(({ item, question }) => gradeAnswer(question, answers[item.examItemId] ?? [])).length
  const unanswered = items.filter(({ item }) => !(answers[item.examItemId]?.length)).length
  return { correct, unanswered, percent: items.length ? Math.round((correct / items.length) * 100) : 0 }
}

export function examAttempts(exam: Exam, items: ResolvedExamItem[], answers: Record<string, string[]>, answeredAt: string): AttemptRecord[] {
  return items.map(({ item, question }) => {
    const selectedOptionIds = answers[item.examItemId] ?? []
    return {
      questionId: question.id,
      questionVersion: item.questionVersion,
      selectedOptionId: selectedOptionIds.length === 1 ? selectedOptionIds[0] : null,
      selectedOptionIds,
      isCorrect: gradeAnswer(question, selectedOptionIds),
      answeredAt,
      source: 'exam',
      examId: exam.examId,
      examItemId: item.examItemId,
    }
  })
}
