import type { AttemptRecord, PracticeSession, Question, VocabularyEntry } from './types'

const key = (subjectId: string, name: 'attempts' | 'session') => `studypack:${subjectId}:quizcard:${name}:v1`
export const quizcardSubjectId = (subjectId: string) => `${subjectId}:quizcard`
export function quizcardQuestions(subjectId: string, entries: VocabularyEntry[]): Question[] { return entries.map(entry => ({ id: `quizcard-${entry.vocabularyId}`, subjectId, version: 1, active: true, maxSelections: 1, blocks: [{ type: 'markdown', text: entry.written }], options: [{ id: `quizcard-option-${entry.vocabularyId}`, blocks: [{ type: 'markdown', text: entry.romaji }] }], correctAnswerIds: [`quizcard-option-${entry.vocabularyId}`] })) }
export function loadQuizcardAttempts(subjectId: string): AttemptRecord[] { try { const value = JSON.parse(localStorage.getItem(key(subjectId, 'attempts')) ?? '[]'); return Array.isArray(value) ? value as AttemptRecord[] : [] } catch { return [] } }
export function saveQuizcardAttempt(subjectId: string, attempt: AttemptRecord) { localStorage.setItem(key(subjectId, 'attempts'), JSON.stringify([...loadQuizcardAttempts(subjectId), attempt])) }
export function clearQuizcardAttempts(subjectId: string) { localStorage.removeItem(key(subjectId, 'attempts')) }
export function loadQuizcardSession(subjectId: string): PracticeSession | null { try { const value = JSON.parse(localStorage.getItem(key(subjectId, 'session')) ?? 'null'); return value?.subjectId === subjectId && value.status === 'in_progress' ? value as PracticeSession : null } catch { return null } }
export function saveQuizcardSession(session: PracticeSession) { localStorage.setItem(key(session.subjectId, 'session'), JSON.stringify(session)) }
export function clearQuizcardSession(subjectId: string) { localStorage.removeItem(key(subjectId, 'session')) }
