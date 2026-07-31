import { describe, expect, it, vi } from 'vitest'
import { contentUrl, loadNotebookDocuments, loadSubjectCatalog } from './content'

describe('content loading', () => {
  it('uses the current build revision in content URLs', () => {
    expect(contentUrl('index.json')).toContain('subjects/index.json?v=')
  })

  it('fetches the catalog through the revisioned URL', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ schemaVersion: '1.0', subjects: [] }), { status: 200 }))
    await loadSubjectCatalog()
    expect(fetchMock).toHaveBeenCalledWith(contentUrl('index.json'))
    fetchMock.mockRestore()
  })

  it('does not block a published subject when optional Gemini documents are absent', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }))
    await expect(loadNotebookDocuments('prj301')).resolves.toEqual({ subjectContext: '', tutorRules: '' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    fetchMock.mockRestore()
  })
})
