import type { AttemptRecord, Question } from './types'

export type LearningStatus = 'not_practiced' | 'learning' | 'weak' | 'developing' | 'stable' | 'mastered'

export function learningStatus(attempts: AttemptRecord[]): LearningStatus {
  if (attempts.length === 0) return 'not_practiced'
  if (attempts.length <= 3) return 'learning'
  const accuracy = attempts.filter((attempt) => attempt.isCorrect).length / attempts.length
  if (accuracy <= 0.5) return 'weak'
  if (accuracy <= 0.75) return 'developing'
  if (accuracy < 0.9) return 'stable'
  return 'mastered'
}

export function summarizeQuestions(questions: Question[], attempts: AttemptRecord[]) {
  const byQuestion = new Map<string, AttemptRecord[]>()
  attempts.forEach((attempt) => byQuestion.set(attempt.questionId, [...(byQuestion.get(attempt.questionId) ?? []), attempt]))
  const counts = { not_practiced: 0, learning: 0, weak: 0, developing: 0, stable: 0, mastered: 0 }
  questions.forEach((question) => { counts[learningStatus(byQuestion.get(question.id) ?? [])] += 1 })
  const correct = attempts.filter((attempt) => attempt.isCorrect).length
  return { counts, totalAttempts: attempts.length, correct, accuracy: attempts.length ? Math.round((correct / attempts.length) * 100) : 0 }
}
