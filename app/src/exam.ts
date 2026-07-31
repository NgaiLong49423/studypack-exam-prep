import type { Exam, Question } from './types'

export function examQuestions(exam: Exam, questions: Question[]): Question[] {
  const byId = new Map(questions.map((question) => [question.id, question]))
  return exam.items.map((item) => byId.get(item.questionId)).filter((question): question is Question => Boolean(question))
}

export function examScore(answers: Record<string, string>, questions: Question[]) {
  const correct = questions.filter((question) => answers[question.id] === question.correctAnswerIds[0]).length
  return { correct, unanswered: questions.length - Object.keys(answers).length, percent: Math.round((correct / questions.length) * 100) }
}
