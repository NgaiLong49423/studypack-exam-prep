import { describe, expect, it } from 'vitest'
import { createMockExam, examAttempts, examScore, formatRemainingTime, resolveExamItems } from './exam'
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
    expect(examScore({ 'item-1': ['opt-a'], 'item-2': ['opt-b'] }, items)).toEqual({ correct: 1, unanswered: 0, percent: 50 })
  })

  it('creates one saved attempt per item only after submit', () => {
    const attempts = examAttempts(exam, resolveExamItems(exam, [question]), { 'item-1': ['opt-a'] }, '2026-07-31T00:00:00.000Z')
    expect(attempts).toHaveLength(2)
    expect(attempts[0]).toMatchObject({ source: 'exam', examId: exam.examId, examItemId: 'item-1', selectedOptionIds: ['opt-a'], isCorrect: true })
    expect(attempts[1]).toMatchObject({ examItemId: 'item-2', selectedOptionIds: [], isCorrect: false })
  })

  it('scores a multiple-answer item only when the complete set is selected', () => {
    const multiple = { ...question, correctAnswerIds: ['opt-a', 'opt-b'], maxSelections: 2 }
    const items = resolveExamItems({ ...exam, items: [{ ...exam.items[0], questionId: multiple.id }] }, [multiple])
    expect(examScore({ 'item-1': ['opt-a', 'opt-b'] }, items).correct).toBe(1)
    expect(examScore({ 'item-1': ['opt-a'] }, items).correct).toBe(0)
  })

  it('creates a unique bounded mock exam from active questions', () => {
    const questions = Array.from({ length: 55 }, (_, index) => ({ ...question, id: `jpd123-q-${index}`, active: index !== 54 }))
    const mock = createMockExam('jpd123', [...questions, questions[0]], 50, 123)
    expect(mock.examId).toBe('mock-jpd123-123')
    expect(mock.items).toHaveLength(50)
    expect(new Set(mock.items.map((item) => item.questionId)).size).toBe(50)
  })

  it('uses all available questions when the bank has fewer than the requested count', () => {
    const mock = createMockExam('jpd123', [question], 30, 123)
    expect(mock.items).toHaveLength(1)
    expect(formatRemainingTime(65)).toBe('01:05')
    expect(formatRemainingTime(-1)).toBe('00:00')
  })
})
