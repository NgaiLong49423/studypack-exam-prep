import type { AttemptRecord, Question } from './types'

export const PRACTICE_SESSION_SIZE = 10
export const attemptsStorageKey = (subjectId: string) => `studypack:${subjectId}:attempts:v1`

const bandTargets = [0.35, 0.25, 0.2, 0.12, 0.08]

function frequencyBand(questionId: string, attempts: AttemptRecord[]): number {
  const history = attempts.filter((attempt) => attempt.questionId === questionId)
  if (history.length < 4) return 2
  const accuracy = history.filter((attempt) => attempt.isCorrect).length / history.length
  if (accuracy <= 0.25) return 0
  if (accuracy <= 0.5) return 1
  if (accuracy <= 0.75) return 2
  if (accuracy < 0.9) return 3
  return 4
}

export function selectPracticeQuestions(questions: Question[], attemptsOrSize: AttemptRecord[] | number = [], requestedSize = PRACTICE_SESSION_SIZE): Question[] {
  const attempts = Array.isArray(attemptsOrSize) ? attemptsOrSize : []
  const size = typeof attemptsOrSize === 'number' ? attemptsOrSize : requestedSize
  const available = questions.filter((question) => question.active)
  const limit = Math.min(size, available.length)
  const groups = Array.from({ length: 5 }, () => [] as Question[])
  available.forEach((question) => groups[frequencyBand(question.id, attempts)].push(question))
  groups[2].sort((a, b) => attempts.filter((item) => item.questionId === a.id).length - attempts.filter((item) => item.questionId === b.id).length)
  const quotas = bandTargets.map((target) => Math.floor(limit * target))
  for (let index = 0; quotas.reduce((sum, value) => sum + value, 0) < limit; index = (index + 1) % quotas.length) quotas[index] += 1
  const selected: Question[] = []
  const take = (group: Question[], count: number, isSorted = false) => {
    while (count > 0 && group.length) {
      const maxIndex = isSorted ? Math.ceil(group.length / 2) : group.length
      const index = Math.floor(Math.random() * maxIndex)
      selected.push(group.splice(index, 1)[0])
      count -= 1
    }
    return count
  }
  quotas.forEach((quota, band) => {
    let missing = take(groups[band], quota, band === 2)
    for (let distance = 1; missing > 0 && band + distance < groups.length; distance += 1) missing = take(groups[band + distance], missing, band + distance === 2)
    for (let distance = 1; missing > 0 && band - distance >= 0; distance += 1) missing = take(groups[band - distance], missing, band - distance === 2)
  })
  return selected
}

export function selectRandomQuestions(questions: Question[], size = PRACTICE_SESSION_SIZE): Question[] {
  const uniqueQuestions = Array.from(new Map(
    questions.filter((question) => question.active).map((question) => [question.id, question]),
  ).values())
  const shuffled = uniqueQuestions.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(size, shuffled.length))
}

export function selectUnseenQuestions(questions: Question[], attempts: AttemptRecord[] = [], size = PRACTICE_SESSION_SIZE): Question[] {
  const attemptedQuestionIds = new Set(attempts.map((attempt) => attempt.questionId))
  return selectRandomQuestions(questions.filter((question) => !attemptedQuestionIds.has(question.id)), size)
}

export function selectReviewQuestions(questions: Question[], attempts: AttemptRecord[] = [], size = PRACTICE_SESSION_SIZE): Question[] {
  const byQuestion = new Map<string, AttemptRecord[]>()
  attempts.forEach((attempt) => byQuestion.set(attempt.questionId, [...(byQuestion.get(attempt.questionId) ?? []), attempt]))
  const needsReview = questions.filter((question) => {
    const history = byQuestion.get(question.id) ?? []
    return history.length > 0 && history.filter((attempt) => attempt.isCorrect).length / history.length <= 0.5
  })
  return selectRandomQuestions(needsReview, size)
}

export function gradeAnswer(question: Question, selectedOptionId: string): boolean {
  return question.correctAnswerIds.length === 1 && question.correctAnswerIds[0] === selectedOptionId
}

export function saveAttempt(subjectId: string, attempt: AttemptRecord): void {
  saveAttempts(subjectId, [attempt])
}

export function saveAttempts(subjectId: string, attempts: AttemptRecord[]): void {
  const existing = loadAttempts(subjectId)
  localStorage.setItem(attemptsStorageKey(subjectId), JSON.stringify([...existing, ...attempts]))
}

export function loadAttempts(subjectId: string): AttemptRecord[] {
  try {
    const value = JSON.parse(localStorage.getItem(attemptsStorageKey(subjectId)) ?? '[]')
    return Array.isArray(value) ? value as AttemptRecord[] : []
  } catch {
    return []
  }
}

export function clearAttempts(subjectId: string): void {
  localStorage.removeItem(attemptsStorageKey(subjectId))
}

export function seedStatisticsDemo(subjectId: string, questionIds: string[]): void {
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
  localStorage.setItem(attemptsStorageKey(subjectId), JSON.stringify(attempts))
}
