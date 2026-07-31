export type ContentBlock = {
  type: 'markdown'
  text: string
}

export type QuestionOption = {
  id: string
  blocks: ContentBlock[]
}

export type Question = {
  id: string
  subjectId: string
  version: number
  blocks: ContentBlock[]
  options: QuestionOption[]
  correctAnswerIds: string[]
  maxSelections: number
  explanation?: { blocks: ContentBlock[] }
  active: boolean
}

export type QuestionBank = {
  schemaVersion: string
  subjectId: string
  version: number
  questions: Question[]
}

export type Subject = {
  subjectId: string
  code: string
  name: string
  description: string
  status: 'draft' | 'published' | 'archived'
}

export type AttemptRecord = {
  questionId: string
  questionVersion: number
  selectedOptionId: string
  isCorrect: boolean
  answeredAt: string
}
