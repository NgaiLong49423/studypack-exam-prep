import { describe, expect, it } from 'vitest'
import { examAttempts, examScore, resolveExamItems } from './exam'
import type { Exam, Question } from './types'

const question: Question = {
  id: 'jpd123-q-0001', subjectId: 'jpd123', version: 1, blocks: [{ type: 'markdown', text: 'Question' }],
  options: [{ id: 'opt-a', blocks: [{ type: 'markdown', text: 'A' }] }, { id: 'opt-b', blocks: [{ type: 'markdown', text: 'B' }] }],
  correctAnswerIds: ['opt-a'], maxSelections: 1, active: true,
}

const exam: Exam = {
  examId: 'jpd123-test-fe', title: 'Test exam', declaredQuestionCount: 2,
  items: [
    { examItemId: 'item-1', order: 1, originalNumber: 1, questionId: question.id, questionVersion: 1 },
    { examItemId: 'item-2', order: 2, originalNumber: 2, questionId: question.id, questionVersion: 1 },
  ],
}

describe('exam helpers', () => {
  it('keeps repeated question references independent by exam item ID', () => {
    const items = resolveExamItems(exam, [question])
    expect(examScore({ 'item-1': 'opt-a', 'item-2': 'opt-b' }, items)).toEqual({ correct: 1, unanswered: 0, percent: 50 })
  })

  it('creates one saved attempt per item only after submit', () => {
    const attempts = examAttempts(exam, resolveExamItems(exam, [question]), { 'item-1': 'opt-a' }, '2026-07-31T00:00:00.000Z')
    expect(attempts).toHaveLength(2)
    expect(attempts[0]).toMatchObject({ source: 'exam', examId: exam.examId, examItemId: 'item-1', selectedOptionId: 'opt-a', isCorrect: true })
    expect(attempts[1]).toMatchObject({ examItemId: 'item-2', selectedOptionId: null, isCorrect: false })
  })
})
