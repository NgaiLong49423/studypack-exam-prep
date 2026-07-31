import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { createExportContext, examMarkdown, fullGeminiPack, learningProgressMarkdown, questionBankMarkdown } from './gemini-export'
import type { AttemptRecord, Exam, Question, Subject } from './types'

const subject: Subject = { subjectId: 'jpd123', code: 'JPD123', name: 'Japanese', description: 'Test subject', status: 'published' }
const question: Question = { id: 'q-1', subjectId: 'jpd123', version: 1, blocks: [{ type: 'markdown', text: 'Question text' }], options: [{ id: 'a', blocks: [{ type: 'markdown', text: 'Answer A' }] }], correctAnswerIds: ['a'], maxSelections: 1, active: true }
const exam: Exam = { examId: 'jpd123-test', title: 'Test exam', declaredQuestionCount: 2, items: [{ examItemId: 'item-1', order: 1, originalNumber: 1, questionId: 'q-1', questionVersion: 1 }, { examItemId: 'item-2', order: 2, originalNumber: 2, questionId: 'q-1', questionVersion: 1 }] }
const context = createExportContext('jpd123', '2026-07-31T10:00:00.000Z')

describe('Gemini export', () => {
  it('exports active questions once with shared metadata', () => {
    const markdown = questionBankMarkdown([question, { ...question }], [exam], context)
    expect(markdown.match(/## Question \[q-1\]/g)).toHaveLength(1)
    expect(markdown).toContain(`Snapshot ID: ${context.snapshotId}`)
    expect(markdown).toContain('Test exam — Question 1')
  })

  it('summarizes progress without raw selected answer IDs', () => {
    const attempts: AttemptRecord[] = [{ questionId: 'q-1', questionVersion: 1, selectedOptionId: null, isCorrect: false, answeredAt: '2026-07-31T10:00:00.000Z' }]
    const markdown = learningProgressMarkdown(subject, [question], attempts, context)
    expect(markdown).toContain('- Unanswered: 1')
    expect(markdown).toContain('- Last result: unanswered')
    expect(markdown).not.toContain('selectedOptionId')
  })

  it('preserves every repeated exam item', () => {
    const markdown = examMarkdown(exam, context)
    expect(markdown).toContain('Exam item ID: item-1')
    expect(markdown).toContain('Exam item ID: item-2')
  })

  it('creates a ZIP with every required document', async () => {
    const pack = await fullGeminiPack(subject, [question], [], [exam], [exam], { subjectContext: 'Context', tutorRules: 'Rules' })
    const zip = await JSZip.loadAsync(await pack.blob.arrayBuffer())
    expect(Object.keys(zip.files)).toEqual(expect.arrayContaining(['STUDYPACK-GEMINI-GUIDE.md', 'subject-context.md', 'question-bank.md', 'learning-progress.md', 'exams/jpd123-test.md']))
  })
})
