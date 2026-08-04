import type { Exam, QuestionBank, ReadingDocument, ReadingDocumentIndex, Subject, SubjectCatalog, VocabularyBank } from './types'

const contentRevision = import.meta.env.VITE_CONTENT_REVISION || 'development'
export const contentUrl = (path: string) => `${import.meta.env.BASE_URL}subjects/${path}?v=${encodeURIComponent(contentRevision)}`
const subjectUrl = (subjectId: string, path: string) => contentUrl(`${subjectId}/${path}`)

export async function loadSubjectCatalog(): Promise<SubjectCatalog> {
  const response = await fetch(contentUrl('index.json'))
  if (!response.ok) throw new Error('Không thể tải danh mục môn học.')
  return response.json() as Promise<SubjectCatalog>
}

export async function loadSubject(subjectId: string): Promise<Subject> {
  const response = await fetch(subjectUrl(subjectId, 'subject.json'))
  if (!response.ok) throw new Error(`Không thể tải cấu hình môn ${subjectId}.`)
  return response.json() as Promise<Subject>
}

export async function loadQuestions(subjectId: string): Promise<QuestionBank> {
  const response = await fetch(subjectUrl(subjectId, 'questions/questions.json'))
  if (!response.ok) throw new Error(`Không thể tải ngân hàng câu hỏi ${subjectId}.`)
  return response.json() as Promise<QuestionBank>
}

export async function loadExams(subjectId: string, examIds: string[]): Promise<Exam[]> {
  return Promise.all(examIds.map(async (examId) => {
    const response = await fetch(subjectUrl(subjectId, `exams/${examId}.json`))
    if (!response.ok) throw new Error(`Không thể tải đề thi ${examId}.`)
    return response.json() as Promise<Exam>
  }))
}

export async function loadNotebookDocuments(subjectId: string): Promise<{ subjectContext: string; tutorRules: string }> {
  const loadOptionalDocument = async (path: string) => {
    try {
      const response = await fetch(subjectUrl(subjectId, path))
      return response.ok ? response.text() : ''
    } catch {
      return ''
    }
  }
  const [subjectContext, tutorRules] = await Promise.all(['notebook/subject-context.md', 'notebook/tutor-rules.md'].map(loadOptionalDocument))
  return { subjectContext, tutorRules }
}

export async function loadJapaneseStudyContent(subjectId: string): Promise<{ readingDocuments: ReadingDocument[]; vocabulary: VocabularyBank | null }> {
  try {
    const indexResponse = await fetch(subjectUrl(subjectId, 'reading/reading-index.json'))
    if (!indexResponse.ok) return { readingDocuments: [], vocabulary: null }
    const index = await indexResponse.json() as ReadingDocumentIndex
    const [readingDocuments, vocabularyResponse] = await Promise.all([
      Promise.all(index.documents.filter((document) => document.status === 'published').map(async (document) => {
        const response = await fetch(subjectUrl(subjectId, document.file))
        if (!response.ok) throw new Error(`Không thể tải bài đọc ${document.title}.`)
        return response.json() as Promise<ReadingDocument>
      })),
      fetch(subjectUrl(subjectId, 'vocabulary/vocabulary.json')),
    ])
    return { readingDocuments, vocabulary: vocabularyResponse.ok ? await vocabularyResponse.json() as VocabularyBank : null }
  } catch {
    return { readingDocuments: [], vocabulary: null }
  }
}
