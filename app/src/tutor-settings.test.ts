import { beforeEach, describe, expect, it } from 'vitest'
import { clearTutorNotebookUrl, loadTutorNotebookUrl, saveTutorNotebookUrl } from './tutor-settings'

describe('personal Gemini Notebook setting', () => {
  beforeEach(() => localStorage.clear())

  it('saves a HTTPS URL separately for a subject', () => {
    expect(saveTutorNotebookUrl('jpd123', 'https://notebooklm.google.com/notebook/example')).toEqual({ ok: true, url: 'https://notebooklm.google.com/notebook/example' })
    expect(loadTutorNotebookUrl('jpd123')).toBe('https://notebooklm.google.com/notebook/example')
    expect(loadTutorNotebookUrl('other-subject')).toBe('')
  })

  it('rejects an unsafe or malformed URL', () => {
    expect(saveTutorNotebookUrl('jpd123', 'javascript:alert(1)')).toMatchObject({ ok: false })
    expect(saveTutorNotebookUrl('jpd123', 'not-a-url')).toMatchObject({ ok: false })
  })

  it('removes only the current subject setting', () => {
    saveTutorNotebookUrl('jpd123', 'https://notebooklm.google.com/notebook/one')
    saveTutorNotebookUrl('other-subject', 'https://notebooklm.google.com/notebook/two')
    clearTutorNotebookUrl('jpd123')
    expect(loadTutorNotebookUrl('jpd123')).toBe('')
    expect(loadTutorNotebookUrl('other-subject')).toBe('https://notebooklm.google.com/notebook/two')
  })
})
