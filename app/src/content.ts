import type { QuestionBank, Subject } from './types'

const contentUrl = (path: string) => `${import.meta.env.BASE_URL}subjects/jpd123/${path}`

export async function loadJpd123Subject(): Promise<Subject> {
  const response = await fetch(contentUrl('subject.json'))
  if (!response.ok) throw new Error('Không thể tải cấu hình môn JPD123.')
  return response.json() as Promise<Subject>
}

export async function loadJpd123Questions(): Promise<QuestionBank> {
  const response = await fetch(contentUrl('questions/questions.json'))
  if (!response.ok) throw new Error('Không thể tải ngân hàng câu hỏi JPD123.')
  return response.json() as Promise<QuestionBank>
}
