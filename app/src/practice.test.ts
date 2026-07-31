import { describe, expect, it, vi } from 'vitest'
import { gradeAnswer, selectPracticeQuestions, selectRandomQuestions } from './practice'
import type { Question } from './types'

const questions: Question[] = [
  {
    id: 'jpd123-q-0001', subjectId: 'jpd123', version: 1,
    blocks: [{ type: 'markdown', text: 'Question one' }],
    options: [{ id: 'opt-a', blocks: [{ type: 'markdown', text: 'A' }] }],
    correctAnswerIds: ['opt-a'], maxSelections: 1, active: true,
  },
  {
    id: 'jpd123-q-0002', subjectId: 'jpd123', version: 1,
    blocks: [{ type: 'markdown', text: 'Question two' }],
    options: [{ id: 'opt-b', blocks: [{ type: 'markdown', text: 'B' }] }],
    correctAnswerIds: ['opt-b'], maxSelections: 1, active: true,
  },
]

describe('practice helpers', () => {
  it('keeps selected questions unique in a session', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.4)
    const session = selectPracticeQuestions(questions, 2)

    expect(new Set(session.map((question) => question.id)).size).toBe(2)
  })

  it('grades by stable option ID', () => {
    expect(gradeAnswer(questions[0], 'opt-a')).toBe(true)
    expect(gradeAnswer(questions[0], 'opt-b')).toBe(false)
  })

  it('selects unique active questions for random practice', () => {
    const duplicatedQuestions = [...questions, { ...questions[0], blocks: [{ type: 'markdown' as const, text: 'Duplicate content' }] }]
    const session = selectRandomQuestions(duplicatedQuestions, 3)
    expect(session).toHaveLength(2)
    expect(new Set(session.map((question) => question.id)).size).toBe(2)
  })

  it('prioritizes low-accuracy questions while keeping a session unique', () => {
    const expanded = Array.from({ length: 20 }, (_, index) => ({ ...questions[index % 2], id: `jpd123-q-${index}` }))
    const attempts = expanded.flatMap((question, index) => Array.from({ length: 4 }, () => ({ questionId: question.id, isCorrect: index < 10 ? false : true })) as never[])
    const session = selectPracticeQuestions(expanded, attempts as never, 10)
    expect(session.filter((question) => Number(question.id.split('-').at(-1)) < 10)).toHaveLength(4)
    expect(new Set(session.map((question) => question.id)).size).toBe(10)
  })

  it('prefers zero-attempt questions over three-attempt questions in the normal band', () => {
    const normalBand = Array.from({ length: 20 }, (_, index) => ({ ...questions[index % 2], id: `normal-${index}` }))
    const attempts = normalBand.flatMap((question, index) => Array.from({ length: index < 10 ? 0 : 3 }, () => ({ questionId: question.id, isCorrect: true })) as never[])
    vi.spyOn(Math, 'random').mockReturnValue(0.25)
    const sessions = Array.from({ length: 100 }, () => selectPracticeQuestions(normalBand, attempts as never, 10))
    const zeroAttemptSelections = sessions.flat().filter((question) => Number(question.id.split('-').at(-1)) < 10).length
    const threeAttemptSelections = sessions.flat().filter((question) => Number(question.id.split('-').at(-1)) >= 10).length
    expect(zeroAttemptSelections).toBeGreaterThan(threeAttemptSelections * 2)
  })
})
