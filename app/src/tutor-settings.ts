const storageKey = (subjectId: string) => `studypack:${subjectId}:ai-tutor:notebook-url:v1`

export function loadTutorNotebookUrl(subjectId: string): string {
  try {
    return localStorage.getItem(storageKey(subjectId)) ?? ''
  } catch {
    return ''
  }
}

export function saveTutorNotebookUrl(subjectId: string, value: string): { ok: true; url: string } | { ok: false; message: string } {
  const rawUrl = value.trim()
  if (!rawUrl) return { ok: false, message: 'Hãy dán đường link Gemini Notebook trước khi lưu.' }
  try {
    const url = new URL(rawUrl)
    if (url.protocol !== 'https:') return { ok: false, message: 'Chỉ chấp nhận đường link HTTPS để mở Gemini an toàn.' }
    localStorage.setItem(storageKey(subjectId), url.toString())
    return { ok: true, url: url.toString() }
  } catch {
    return { ok: false, message: 'Đường link Gemini chưa hợp lệ.' }
  }
}

export function clearTutorNotebookUrl(subjectId: string): void {
  try {
    localStorage.removeItem(storageKey(subjectId))
  } catch {
    // Local storage may be unavailable in a restricted browser context.
  }
}
