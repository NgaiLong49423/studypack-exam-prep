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
  selectedOptionIds?: string[]
  optionOrder?: string[]
  isCorrect: boolean
  answeredAt: string
  source?: 'practice' | 'exam'
  examId?: string
  examItemId?: string
}

export type PracticeMode = 'smart' | 'random' | 'unseen' | 'review'

export type PracticeSession = {
  sessionId: string
  subjectId: string
  mode: PracticeMode
  questionRefs: { questionId: string; questionVersion: number; optionOrder?: string[] }[]
  position: number
  selectedOptionIds: string[]
  isLocked: boolean
  correctCount: number
  startedAt: string
  updatedAt: string
  status: 'in_progress'
}

export type ExamItem = { examItemId: string; order: number; originalNumber: number; questionId: string; questionVersion: number }
export type Exam = { examId: string; title: string; declaredQuestionCount: number; items: ExamItem[] }

export type ReadingToken = { tokenId: string; japanese: string; romaji: string; kind: 'word' | 'particle' | 'number' | 'punctuation' | 'phrase' }
export type ReadingParagraph = { paragraphId: string; japaneseText: string; sourceRomajiText: string; tokens: ReadingToken[] }
export type ReadingPassage = { passageId: string; title: string; order: number; status: 'draft' | 'published' | 'archived'; paragraphs: ReadingParagraph[] }
export type ReadingDocumentIndexEntry = { readingDocumentId: string; title: string; file: string; status: 'draft' | 'published' | 'archived'; order: number; passageCount: number }
export type ReadingDocumentIndex = { schemaVersion: string; subjectId: string; documents: ReadingDocumentIndexEntry[] }
export type ReadingDocument = { schemaVersion: string; subjectId: string; readingDocumentId: string; title: string; sourceMarkdown: string; passages: ReadingPassage[] }
export type VocabularyEntry = { vocabularyId: string; written: string; kanji: string | null; kana: string; romaji: string; meaningVi: string; categoryId: string; categoryName: string; status: 'draft' | 'published' | 'archived' }
export type VocabularyBank = { schemaVersion: string; subjectId: string; entries: VocabularyEntry[] }
