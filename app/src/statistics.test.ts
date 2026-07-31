import { expect, it } from 'vitest'
import { learningStatus } from './statistics'

it('classifies weak and mastered questions using accepted thresholds', () => {
  expect(learningStatus([])).toBe('not_practiced')
  expect(learningStatus([{ isCorrect: false } as never])).toBe('learning')
  expect(learningStatus(Array(4).fill({ isCorrect: false }) as never)).toBe('weak')
  expect(learningStatus(Array(10).fill({ isCorrect: true }) as never)).toBe('mastered')
})
