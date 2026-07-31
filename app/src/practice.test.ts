import { describe, expect, it, vi } from 'vitest'
import { gradeAnswer, selectPracticeQuestions } from './practice'
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

  it('prioritizes low-accuracy questions while keeping a session unique', () => {
    const expanded = Array.from({ length: 20 }, (_, index) => ({ ...questions[index % 2], id: `jpd123-q-${index}` }))
    const attempts = expanded.flatMap((question, index) => Array.from({ length: 4 }, () => ({ questionId: question.id, isCorrect: index < 10 ? false : true })) as never[])
    const session = selectPracticeQuestions(expanded, attempts as never, 10)
    expect(session.filter((question) => Number(question.id.split('-').at(-1)) < 10)).toHaveLength(4)
    expect(new Set(session.map((question) => question.id)).size).toBe(10)
  })
})
