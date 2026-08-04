import type { VocabularyEntry } from './types'

export type VocabularyReview = {
  vocabularyId: string
  seenCount: number
  rememberedCount: number
  notRememberedCount: number
  lastReviewedAt: string
}

const storageKey = (subjectId: string) => `studypack:${subjectId}:vocabulary-progress:v1`

export function loadVocabularyReviews(subjectId: string): Record<string, VocabularyReview> {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(subjectId)) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed as Record<string, VocabularyReview> : {}
  } catch {
    return {}
  }
}

export function recordVocabularyReview(subjectId: string, vocabularyId: string, remembered: boolean, reviewedAt = new Date().toISOString()): VocabularyReview {
  const reviews = loadVocabularyReviews(subjectId)
  const previous = reviews[vocabularyId] ?? { vocabularyId, seenCount: 0, rememberedCount: 0, notRememberedCount: 0, lastReviewedAt: reviewedAt }
  const review: VocabularyReview = {
    ...previous,
    seenCount: previous.seenCount + 1,
    rememberedCount: previous.rememberedCount + Number(remembered),
    notRememberedCount: previous.notRememberedCount + Number(!remembered),
    lastReviewedAt: reviewedAt,
  }
  localStorage.setItem(storageKey(subjectId), JSON.stringify({ ...reviews, [vocabularyId]: review }))
  return review
}

export function createQuizcardQueue(entries: VocabularyEntry[], random: () => number = Math.random): VocabularyEntry[] {
  const queue = [...entries]
  for (let index = queue.length - 1; index > 0; index -= 1) {
    const selected = Math.floor(random() * (index + 1))
    ;[queue[index], queue[selected]] = [queue[selected], queue[index]]
  }
  return queue
}
