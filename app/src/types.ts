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
  aiTutor?: {
    enabled: boolean
    provider: 'gemini-notebook'
    promptTemplateId: string
  }
}

export type SubjectCatalogEntry = Pick<Subject, 'subjectId' | 'code' | 'name' | 'description' | 'status'> & { examIds: string[] }

export type SubjectCatalog = { schemaVersion: string; subjects: SubjectCatalogEntry[] }

export type AttemptRecord = {
  questionId: string
  questionVersion: number
  selectedOptionId: string | null
  isCorrect: boolean
  answeredAt: string
  source?: 'practice' | 'exam'
  examId?: string
  examItemId?: string
}

export type ExamItem = { examItemId: string; order: number; originalNumber: number; questionId: string; questionVersion: number }
export type Exam = { examId: string; title: string; declaredQuestionCount: number; items: ExamItem[] }
