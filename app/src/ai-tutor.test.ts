import { describe, expect, it } from 'vitest'
import { createAiTutorPrompt } from './ai-tutor'
import type { Question, Subject } from './types'

const subject: Subject = { subjectId: 'jpd123', code: 'JPD123', name: 'Japanese', description: 'Test', status: 'published' }
const question: Question = {
  id: 'jpd123-q-0001', subjectId: 'jpd123', version: 1, blocks: [{ type: 'markdown', text: 'Question content' }],
  options: [{ id: 'opt-a', blocks: [{ type: 'markdown', text: 'Option A' }] }, { id: 'opt-b', blocks: [{ type: 'markdown', text: 'Option B' }] }],
  correctAnswerIds: ['opt-b'], maxSelections: 1, active: true,
}

describe('AI tutor prompt', () => {
  it('includes official context, question and answer for Gemini', () => {
    const prompt = createAiTutorPrompt(subject, question, { title: 'SP26 C2FE', questionNumber: 17 })
    expect(prompt).toContain('Môn học: JPD123')
    expect(prompt).toContain('Mã câu hỏi: jpd123-q-0001')
    expect(prompt).toContain('SP26 C2FE — Câu 17')
    expect(prompt).toContain('[opt-b] Option B')
    expect(prompt).toContain('Chưa có lời giải')
  })

  it('does not include learner answer or progress data', () => {
    const prompt = createAiTutorPrompt(subject, question)
    expect(prompt).not.toContain('selectedOptionId')
    expect(prompt).not.toContain('Tỉ lệ đúng')
    expect(prompt).not.toContain('Lịch sử làm bài')
  })
})
