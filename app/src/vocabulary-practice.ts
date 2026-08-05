import type { AttemptRecord, PracticeSession, Question, VocabularyEntry } from './types'

const key = (subjectId: string, name: 'attempts' | 'session') => `studypack:${subjectId}:vocabulary-practice:${name}:v1`

const hash = (value: string) => [...value].reduce((total, character) => (total * 31 + character.codePointAt(0)!) >>> 0, 7)

export function vocabularyQuestions(subjectId: string, entries: VocabularyEntry[]): Question[] {
  return entries.map((entry) => {
    const distractors = entries.filter((candidate) => candidate.vocabularyId !== entry.vocabularyId && candidate.romaji !== entry.romaji)
      .sort((left, right) => hash(`${entry.vocabularyId}:${left.vocabularyId}`) - hash(`${entry.vocabularyId}:${right.vocabularyId}`))
      .slice(0, 3)
    const choices = [entry, ...distractors]
    const correctId = `vocab-option-${entry.vocabularyId}`
    return {
      id: `vocab-romaji-${entry.vocabularyId}`, subjectId, version: 1, active: true, maxSelections: 1,
      blocks: [{ type: 'markdown', text: entry.written }],
      options: choices.map((choice) => ({ id: `vocab-option-${choice.vocabularyId}`, blocks: [{ type: 'markdown', text: choice.romaji }] })),
      correctAnswerIds: [correctId],
      explanation: { blocks: [{ type: 'markdown', text: `${entry.kana} — ${entry.romaji}\n${entry.meaningVi}` }] },
    }
  })
}

export function loadVocabularyAttempts(subjectId: string): AttemptRecord[] { try { const value = JSON.parse(localStorage.getItem(key(subjectId, 'attempts')) ?? '[]'); return Array.isArray(value) ? value as AttemptRecord[] : [] } catch { return [] } }
export function saveVocabularyAttempt(subjectId: string, attempt: AttemptRecord) { localStorage.setItem(key(subjectId, 'attempts'), JSON.stringify([...loadVocabularyAttempts(subjectId), attempt])) }
export function clearVocabularyAttempts(subjectId: string) { localStorage.removeItem(key(subjectId, 'attempts')) }
export function loadVocabularySession(subjectId: string): PracticeSession | null { try { const value = JSON.parse(localStorage.getItem(key(subjectId, 'session')) ?? 'null'); return value?.subjectId === subjectId && value.status === 'in_progress' ? value as PracticeSession : null } catch { return null } }
export function saveVocabularySession(session: PracticeSession) { localStorage.setItem(key(session.subjectId, 'session'), JSON.stringify(session)) }
export function clearVocabularySession(subjectId: string) { localStorage.removeItem(key(subjectId, 'session')) }
export const vocabularySessionSubjectId = (subjectId: string) => `${subjectId}:vocabulary-romaji`
