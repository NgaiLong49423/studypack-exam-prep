import { expect, it } from 'vitest'
import { ATTEMPTS_STORAGE_KEY, seedStatisticsDemo } from './practice'
import { learningStatus } from './statistics'

it('creates deterministic attempts for every statistics threshold', () => {
  seedStatisticsDemo(['q1', 'q2', 'q3', 'q4', 'q5', 'q6'])
  const attempts = JSON.parse(localStorage.getItem(ATTEMPTS_STORAGE_KEY) ?? '[]')
  expect(attempts).toHaveLength(19)
  expect(attempts.some((attempt: { questionId: string }) => attempt.questionId === 'q1')).toBe(false)
  expect(['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].map((questionId) => learningStatus(attempts.filter((attempt: { questionId: string }) => attempt.questionId === questionId)))).toEqual([
    'not_practiced', 'learning', 'weak', 'developing', 'stable', 'mastered',
  ])
})
