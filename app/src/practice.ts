import type { AttemptRecord, Question } from './types'

export const PRACTICE_SESSION_SIZE = 10
export const ATTEMPTS_STORAGE_KEY = 'studypack:jpd123:attempts:v1'

export function selectPracticeQuestions(questions: Question[], size = PRACTICE_SESSION_SIZE): Question[] {
  const available = questions.filter((question) => question.active)
  const shuffled = [...available]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }

  return shuffled.slice(0, Math.min(size, shuffled.length))
}

export function gradeAnswer(question: Question, selectedOptionId: string): boolean {
  return question.correctAnswerIds.length === 1 && question.correctAnswerIds[0] === selectedOptionId
}

export function saveAttempt(attempt: AttemptRecord): void {
  const existing = loadAttempts()
  localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify([...existing, attempt]))
}

export function loadAttempts(): AttemptRecord[] {
  try {
    const value = JSON.parse(localStorage.getItem(ATTEMPTS_STORAGE_KEY) ?? '[]')
    return Array.isArray(value) ? value as AttemptRecord[] : []
  } catch {
    return []
  }
}

export function clearAttempts(): void {
  localStorage.removeItem(ATTEMPTS_STORAGE_KEY)
}

export function seedStatisticsDemo(questionIds: string[]): void {
  const patterns = [
    [],
    [true, false],
    [false, false, false, false],
    [true, true, true, false],
    [true, true, true, true, false],
    [true, true, true, true],
  ]
  const attempts = patterns.flatMap((pattern, questionIndex) => pattern.map((isCorrect, attemptIndex) => ({
    questionId: questionIds[questionIndex], questionVersion: 1, selectedOptionId: isCorrect ? 'opt-a' : 'opt-b', isCorrect,
    answeredAt: new Date(2026, 0, attemptIndex + 1).toISOString(),
  })))
  localStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts))
}
