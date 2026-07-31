import { expect, it } from 'vitest'
import { attemptsStorageKey, seedStatisticsDemo } from './practice'

it('creates deterministic attempts for every statistics threshold', () => {
  seedStatisticsDemo('jpd123', ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'])
  const attempts = JSON.parse(localStorage.getItem(attemptsStorageKey('jpd123')) ?? '[]')
  expect(attempts).toHaveLength(19)
  expect(attempts.some((attempt: { questionId: string }) => attempt.questionId === 'q1')).toBe(false)
})
