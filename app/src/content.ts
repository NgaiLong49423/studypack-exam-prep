import type { Exam, QuestionBank, Subject, SubjectCatalog } from './types'

const contentUrl = (path: string) => `${import.meta.env.BASE_URL}subjects/${path}`
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
  const [subjectContext, tutorRules] = await Promise.all(['notebook/subject-context.md', 'notebook/tutor-rules.md'].map(async (path) => {
    const response = await fetch(subjectUrl(subjectId, path))
    if (!response.ok) throw new Error(`Không thể tải tài liệu Gemini của ${subjectId}.`)
    return response.text()
  }))
  return { subjectContext, tutorRules }
}
