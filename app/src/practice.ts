import type { AttemptRecord, PracticeMode, PracticeSession, Question } from './types'

export const PRACTICE_SESSION_SIZE = 20
export const attemptsStorageKey = (subjectId: string) => `studypack:${subjectId}:attempts:v1`
export const practiceSessionStorageKey = (subjectId: string) => `studypack:${subjectId}:practice-session:v1`

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

export function selectPracticeQuestions(questions: Question[], attemptsOrSize: AttemptRecord[] | number = [], requestedSize = PRACTICE_SESSION_SIZE, excludeQuestionIds: string[] = []): Question[] {
  const attempts = Array.isArray(attemptsOrSize) ? attemptsOrSize : []
  const size = typeof attemptsOrSize === 'number' ? attemptsOrSize : requestedSize
  const excludeSet = new Set(excludeQuestionIds)
  const available = questions.filter((question) => question.active && !excludeSet.has(question.id))
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

export function selectRandomQuestions(questions: Question[], size = PRACTICE_SESSION_SIZE, excludeQuestionIds: string[] = []): Question[] {
  const excludeSet = new Set(excludeQuestionIds)
  const uniqueQuestions = Array.from(new Map(
    questions.filter((question) => question.active && !excludeSet.has(question.id)).map((question) => [question.id, question]),
  ).values())
  const shuffled = uniqueQuestions.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(size, shuffled.length))
}

export function selectUnseenQuestions(questions: Question[], attempts: AttemptRecord[] = [], size = PRACTICE_SESSION_SIZE, excludeQuestionIds: string[] = []): Question[] {
  const attemptedQuestionIds = new Set(attempts.map((attempt) => attempt.questionId))
  const excludeSet = new Set([...attemptedQuestionIds, ...excludeQuestionIds])
  return selectRandomQuestions(questions.filter((question) => !excludeSet.has(question.id)), size)
}

export function selectReviewQuestions(questions: Question[], attempts: AttemptRecord[] = [], size = PRACTICE_SESSION_SIZE, excludeQuestionIds: string[] = []): Question[] {
  const byQuestion = new Map<string, AttemptRecord[]>()
  attempts.forEach((attempt) => byQuestion.set(attempt.questionId, [...(byQuestion.get(attempt.questionId) ?? []), attempt]))
  const excludeSet = new Set(excludeQuestionIds)
  const needsReview = questions.filter((question) => {
    if (excludeSet.has(question.id)) return false
    const history = byQuestion.get(question.id) ?? []
    return history.length > 0 && history.filter((attempt) => attempt.isCorrect).length / history.length <= 0.5
  })
  return selectRandomQuestions(needsReview, size)
}

export function gradeAnswer(question: Question, selectedOptionIds: string | string[]): boolean {
  const selected = Array.isArray(selectedOptionIds) ? selectedOptionIds : [selectedOptionIds]
  return selected.length === question.correctAnswerIds.length
    && selected.every((optionId) => question.correctAnswerIds.includes(optionId))
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

export function createPracticeSession(subjectId: string, mode: PracticeMode, questions: Question[], now = new Date().toISOString()): PracticeSession {
  return {
    sessionId: `practice-${subjectId}-${Date.now()}`,
    subjectId,
    mode,
    questionRefs: questions.map((question) => {
      const optionOrder = question.options.map((o) => o.id).sort(() => Math.random() - 0.5)
      return { questionId: question.id, questionVersion: question.version, optionOrder }
    }),
    position: 0,
    selectedOptionIds: [],
    isLocked: false,
    correctCount: 0,
    startedAt: now,
    updatedAt: now,
    status: 'in_progress',
  }
}

export function savePracticeSession(session: PracticeSession): void {
  localStorage.setItem(practiceSessionStorageKey(session.subjectId), JSON.stringify(session))
}

export function loadPracticeSession(subjectId: string): PracticeSession | null {
  try {
    const value = JSON.parse(localStorage.getItem(practiceSessionStorageKey(subjectId)) ?? 'null') as Partial<PracticeSession> | null
    if (!value || value.subjectId !== subjectId || value.status !== 'in_progress' || !Array.isArray(value.questionRefs) || value.questionRefs.length === 0) return null
    if (typeof value.position !== 'number' || !Number.isInteger(value.position) || value.position < 0 || value.position >= value.questionRefs.length) return null
    if (!Array.isArray(value.selectedOptionIds) || typeof value.isLocked !== 'boolean' || !Number.isInteger(value.correctCount)) return null
    return value as PracticeSession
  } catch {
    return null
  }
}

export function clearPracticeSession(subjectId: string): void {
  localStorage.removeItem(practiceSessionStorageKey(subjectId))
}

export function restorePracticeQuestions(session: PracticeSession, questions: Question[]): Question[] | null {
  const byId = new Map(questions.map((question) => [question.id, question]))
  const restored = session.questionRefs.map(({ questionId, questionVersion }) => {
    const question = byId.get(questionId)
    return question && question.version === questionVersion ? question : null
  })
  return restored.every((question): question is Question => question !== null) ? restored : null
}

export function extendPracticeSession(session: PracticeSession, questions: Question[], attempts: AttemptRecord[]): PracticeSession {

  const recentCount = Math.min(20, session.questionRefs.length)
  const recentIds = session.questionRefs.slice(-recentCount).map(r => r.questionId)
  
  let newQuestions: Question[] = []
  if (session.mode === 'smart') newQuestions = selectPracticeQuestions(questions, attempts, PRACTICE_SESSION_SIZE, recentIds)
  else if (session.mode === 'random') newQuestions = selectRandomQuestions(questions, PRACTICE_SESSION_SIZE, recentIds)
  else if (session.mode === 'unseen') newQuestions = selectUnseenQuestions(questions, attempts, PRACTICE_SESSION_SIZE, recentIds)
  else if (session.mode === 'review') newQuestions = selectReviewQuestions(questions, attempts, PRACTICE_SESSION_SIZE, recentIds)

  if (newQuestions.length === 0) return session

  const newRefs = newQuestions.map(q => {
    const optionOrder = q.options.map(o => o.id).sort(() => Math.random() - 0.5)
    return { questionId: q.id, questionVersion: q.version, optionOrder }
  })

  return {
    ...session,
    questionRefs: [...session.questionRefs, ...newRefs],
    updatedAt: new Date().toISOString()
  }
}
