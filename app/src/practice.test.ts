import { describe, expect, it, vi } from 'vitest'
import { clearPracticeSession, createPracticeSession, gradeAnswer, loadAttempts, loadPracticeSession, restorePracticeQuestions, saveAttempt, savePracticeSession, selectPracticeQuestions, selectRandomQuestions, selectReviewQuestions, selectUnseenQuestions } from './practice'
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

  it('requires the exact full answer set for a multiple-answer question', () => {
    const multiple = { ...questions[0], correctAnswerIds: ['opt-a', 'opt-b'], maxSelections: 2 }
    expect(gradeAnswer(multiple, ['opt-a', 'opt-b'])).toBe(true)
    expect(gradeAnswer(multiple, ['opt-a'])).toBe(false)
    expect(gradeAnswer(multiple, ['opt-a', 'opt-c'])).toBe(false)
  })

  it('keeps browser-local attempts isolated by subject ID', () => {
    saveAttempt('jpd123', { questionId: 'jpd123-q-0001', questionVersion: 1, selectedOptionId: 'opt-a', isCorrect: true, answeredAt: '2026-07-31T00:00:00.000Z' })
    expect(loadAttempts('jpd123')).toHaveLength(1)
    expect(loadAttempts('prj301')).toEqual([])
  })

  it('saves and loads an in-progress practice session by subject', () => {
    const created = createPracticeSession('jpd123', 'random', questions, '2026-08-01T00:00:00.000Z')
    created.position = 1
    created.selectedOptionIds = ['opt-b']
    created.isLocked = true
    created.correctCount = 1
    savePracticeSession(created)

    expect(loadPracticeSession('jpd123')).toMatchObject({
      sessionId: created.sessionId,
      position: 1,
      selectedOptionIds: ['opt-b'],
      isLocked: true,
      correctCount: 1,
    })
    expect(loadPracticeSession('prj301')).toBeNull()
  })

  it('restores the exact question order and rejects a changed question version', () => {
    const created = createPracticeSession('jpd123', 'smart', [questions[1], questions[0]], '2026-08-01T00:00:00.000Z')
    expect(restorePracticeQuestions(created, questions)?.map((question) => question.id)).toEqual(['jpd123-q-0002', 'jpd123-q-0001'])
    expect(restorePracticeQuestions(created, [{ ...questions[0], version: 2 }, questions[1]])).toBeNull()
  })

  it('clears a completed in-progress session', () => {
    const created = createPracticeSession('jpd123', 'random', questions)
    savePracticeSession(created)
    clearPracticeSession('jpd123')
    expect(loadPracticeSession('jpd123')).toBeNull()
  })

  it('selects only active questions with no history for unseen practice', () => {
    const inactive = { ...questions[1], id: 'inactive', active: false }
    const session = selectUnseenQuestions([...questions, inactive], [{ questionId: questions[0].id, isCorrect: false }] as never)
    expect(session.map((question) => question.id)).toEqual([questions[1].id])
  })

  it('selects only attempted questions at or below 50 percent accuracy for review practice', () => {
    const thirdQuestion = { ...questions[0], id: 'jpd123-q-0003' }
    const attempts = [
      { questionId: questions[0].id, isCorrect: false },
      { questionId: questions[1].id, isCorrect: true },
      { questionId: questions[1].id, isCorrect: false },
      { questionId: thirdQuestion.id, isCorrect: true },
      { questionId: thirdQuestion.id, isCorrect: true },
    ] as never
    const session = selectReviewQuestions([...questions, thirdQuestion], attempts)
    expect(new Set(session.map((question) => question.id))).toEqual(new Set([questions[0].id, questions[1].id]))
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
