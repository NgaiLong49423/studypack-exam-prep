import { beforeEach, describe, expect, it } from 'vitest'
import { createQuizcardQueue, loadVocabularyReviews, recordVocabularyReview } from './vocabulary-progress'
import type { VocabularyEntry } from './types'

const entries: VocabularyEntry[] = [
  { vocabularyId: 'jpd123-v-0001', written: '学校', kanji: '学校', kana: 'がっこう', romaji: 'gakkou', meaningVi: 'trường học', categoryId: 'school', categoryName: 'Trường học', status: 'published' },
  { vocabularyId: 'jpd123-v-0002', written: '先生', kanji: '先生', kana: 'せんせい', romaji: 'sensei', meaningVi: 'giáo viên', categoryId: 'school', categoryName: 'Trường học', status: 'published' },
  { vocabularyId: 'jpd123-v-0003', written: '学生', kanji: '学生', kana: 'がくせい', romaji: 'gakusei', meaningVi: 'học sinh', categoryId: 'school', categoryName: 'Trường học', status: 'published' },
]

describe('vocabulary progress', () => {
  beforeEach(() => localStorage.clear())

  it('records remembered and not-remembered reviews independently', () => {
    recordVocabularyReview('jpd123', 'jpd123-v-0001', true, '2026-08-05T10:00:00+07:00')
    const second = recordVocabularyReview('jpd123', 'jpd123-v-0001', false, '2026-08-05T10:05:00+07:00')
    expect(second).toMatchObject({ seenCount: 2, rememberedCount: 1, notRememberedCount: 1, lastReviewedAt: '2026-08-05T10:05:00+07:00' })
    expect(loadVocabularyReviews('prj301')).toEqual({})
  })

  it('creates a complete no-duplicate card queue', () => {
    const queue = createQuizcardQueue(entries, () => 0)
    expect(queue).toHaveLength(entries.length)
    expect(new Set(queue.map((entry) => entry.vocabularyId))).toEqual(new Set(entries.map((entry) => entry.vocabularyId)))
  })
})
