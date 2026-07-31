import type { Question, Subject } from './types'

type ExamContext = { title: string; questionNumber: number }

const textOf = (blocks: { text: string }[]) => blocks.map((block) => block.text).join('\n')

export function createAiTutorPrompt(subject: Subject, question: Question, examContext?: ExamContext): string {
  const options = question.options.map((option, index) => `${index + 1}. [${option.id}] ${textOf(option.blocks)}`).join('\n')
  const correctAnswers = question.options
    .filter((option) => question.correctAnswerIds.includes(option.id))
    .map((option) => `${question.options.indexOf(option) + 1}. [${option.id}] ${textOf(option.blocks)}`)
    .join('\n')
  const source = examContext ? `${examContext.title} — Câu ${examContext.questionNumber}` : 'Không gắn với đề nguồn'
  const explanation = question.explanation ? textOf(question.explanation.blocks) : 'Chưa có lời giải'
  return `Bạn là gia sư hỗ trợ ôn thi. Hãy giải thích kỹ câu trắc nghiệm dưới đây để người học hiểu bản chất, không chỉ đưa đáp án.\n\nMôn học: ${subject.code}\nMã câu hỏi: ${question.id}\nĐề nguồn: ${source}\n\n[Câu hỏi]\n${textOf(question.blocks)}\n\n[Các lựa chọn]\n${options}\n\n[Đáp án đúng]\n${correctAnswers}\n\n[Lời giải hiện có]\n${explanation}\n\nHãy trình bày:\n1. Kiến thức hoặc kỹ năng đang được kiểm tra.\n2. Cách suy luận từng bước để chọn đáp án đúng.\n3. Vì sao các đáp án còn lại không phù hợp hoặc là bẫy.\n4. Quy tắc hoặc khái niệm liên quan trực tiếp.\n5. Một ví dụ ngắn nếu giúp làm rõ kiến thức.\n6. Nếu chưa có lời giải chính thức, nói rõ đây là giải thích hỗ trợ học tập.`
}

export async function copyPromptToClipboard(prompt: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(prompt)
    return true
  } catch {
    return false
  }
}
