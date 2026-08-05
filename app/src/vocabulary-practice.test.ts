import { beforeEach, describe, expect, it } from 'vitest'
import type { VocabularyEntry } from './types'
import { loadVocabularyAttempts, saveVocabularyAttempt, vocabularyQuestions, vocabularySessionSubjectId } from './vocabulary-practice'

const entries: VocabularyEntry[] = [
  ['0001', '学校', 'がっこう', 'gakkou'], ['0002', '先生', 'せんせい', 'sensei'], ['0003', '学生', 'がくせい', 'gakusei'], ['0004', '友達', 'ともだち', 'tomodachi'],
].map(([id, written, kana, romaji]) => ({ vocabularyId: `jpd123-v-${id}`, written, kana, romaji, kanji: written, meaningVi: 'meaning', categoryId: 'test', categoryName: 'Test', status: 'published' }))

describe('vocabulary practice', () => {
  beforeEach(() => localStorage.clear())
  it('creates one stable four-choice romaji question per vocabulary entry', () => {
    const questions = vocabularyQuestions(vocabularySessionSubjectId('jpd123'), entries)
    expect(questions).toHaveLength(entries.length)
    expect(questions[0].options).toHaveLength(4)
    expect(new Set(questions[0].options.map(option => option.id)).size).toBe(4)
    expect(questions[0].correctAnswerIds).toEqual(['vocab-option-jpd123-v-0001'])
  })
  it('stores vocabulary attempts under a separate learning-history key', () => {
    const subjectId = vocabularySessionSubjectId('jpd123')
    saveVocabularyAttempt(subjectId, { questionId: 'vocab-romaji-jpd123-v-0001', questionVersion: 1, selectedOptionId: 'vocab-option-jpd123-v-0001', isCorrect: true, answeredAt: '2026-08-05T00:00:00.000Z' })
    expect(loadVocabularyAttempts(subjectId)).toHaveLength(1)
    expect(localStorage.getItem('studypack:jpd123:attempts:v1')).toBeNull()
  })
})
