import { useMemo, useState } from 'react'
import type { ReadingDocument, VocabularyBank } from './types'
import { createQuizcardQueue, recordVocabularyReview } from './vocabulary-progress'

export function ReadingLibrary({ documents, onBack }: { documents: ReadingDocument[]; onBack: () => void }) {
  const [documentId, setDocumentId] = useState(documents[0]?.readingDocumentId ?? '')
  const [passageId, setPassageId] = useState(documents[0]?.passages[0]?.passageId ?? '')
  const [activeTokenId, setActiveTokenId] = useState('')
  const document = documents.find((item) => item.readingDocumentId === documentId) ?? documents[0]
  const passage = document?.passages.find((item) => item.passageId === passageId) ?? document?.passages[0]

  function changeDocument(nextId: string) {
    const next = documents.find((item) => item.readingDocumentId === nextId)
    setDocumentId(nextId)
    setPassageId(next?.passages[0]?.passageId ?? '')
    setActiveTokenId('')
  }

  if (!document || !passage) return null
  const passagePosition = document.passages.findIndex((item) => item.passageId === passage.passageId)
  const selectPassage = (nextIndex: number) => { const next = document.passages[nextIndex]; if (next) { setPassageId(next.passageId); setActiveTokenId('') } }

  return <main className="japanese-study-shell">
    <header className="japanese-study-header"><button className="text-button inline-button" type="button" onClick={onBack}>← Quay lại môn học</button><p className="eyebrow">JPD123 · Bài đọc song song</p><h1>Đọc tiếng Nhật và xem phiên âm</h1><p>Rê chuột, chạm hoặc tab vào một từ hay cụm để tô sáng phần tương ứng ở hai bên.</p></header>
    <section className="reading-controls" aria-label="Chọn tài liệu và bài đọc">
      <label>Tài liệu<select value={document.readingDocumentId} onChange={(event) => changeDocument(event.target.value)}>{documents.map((item) => <option key={item.readingDocumentId} value={item.readingDocumentId}>{item.title}</option>)}</select></label>
      <label>Bài đọc<select value={passage.passageId} onChange={(event) => { setPassageId(event.target.value); setActiveTokenId('') }}>{document.passages.map((item) => <option key={item.passageId} value={item.passageId}>{item.order}. {item.title}</option>)}</select></label>
    </section>
    <section className="reading-viewer" aria-labelledby="reading-title">
      <div className="reading-viewer-title"><p className="eyebrow">Bài {passagePosition + 1}/{document.passages.length}</p><h2 id="reading-title">{passage.title}</h2></div>
      {passage.paragraphs.map((paragraph) => <div className="parallel-paragraph" key={paragraph.paragraphId}>
        <section aria-label="Tiếng Nhật"><h3>Tiếng Nhật</h3><p className="token-line japanese-line">{paragraph.tokens.map((token) => <button className={activeTokenId === token.tokenId ? 'reading-token active' : 'reading-token'} key={token.tokenId} type="button" onMouseEnter={() => setActiveTokenId(token.tokenId)} onFocus={() => setActiveTokenId(token.tokenId)} onClick={() => setActiveTokenId(token.tokenId)}>{token.japanese}</button>)}</p></section>
        <section aria-label="Phiên âm romaji"><h3>Phiên âm</h3><p className="token-line romaji-line">{paragraph.tokens.map((token) => <button className={activeTokenId === token.tokenId ? 'reading-token active' : 'reading-token'} key={token.tokenId} type="button" onMouseEnter={() => setActiveTokenId(token.tokenId)} onFocus={() => setActiveTokenId(token.tokenId)} onClick={() => setActiveTokenId(token.tokenId)}>{token.romaji}</button>)}</p><p className="source-romaji">Nguồn: {paragraph.sourceRomajiText}</p></section>
      </div>)}
      <div className="reading-navigation"><button className="secondary-button" type="button" disabled={passagePosition === 0} onClick={() => selectPassage(passagePosition - 1)}>← Bài trước</button><button className="primary-button" type="button" disabled={passagePosition === document.passages.length - 1} onClick={() => selectPassage(passagePosition + 1)}>Bài tiếp →</button></div>
    </section>
  </main>
}

export function VocabularyStudy({ vocabulary, onBack, onStartQuizcard }: { vocabulary: VocabularyBank; onBack: () => void; onStartQuizcard: () => void }) {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const categories = useMemo(() => [...new Map(vocabulary.entries.map((entry) => [entry.categoryId, entry.categoryName])).entries()], [vocabulary.entries])
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const entries = vocabulary.entries.filter((entry) => (categoryId === 'all' || entry.categoryId === categoryId) && (!normalizedQuery || [entry.written, entry.kana, entry.romaji, entry.meaningVi].some((value) => value.toLocaleLowerCase().includes(normalizedQuery))))
  return <main className="japanese-study-shell"><header className="japanese-study-header"><button className="text-button inline-button" type="button" onClick={onBack}>← Quay lại môn học</button><p className="eyebrow">JPD123 · Từ vựng</p><h1>Từ Hán, kana và nghĩa Việt</h1><p>{vocabulary.entries.length} từ vựng từ tài liệu ôn thi.</p><button className="primary-button" type="button" onClick={onStartQuizcard}>Bắt đầu Quizcard</button></header><section className="vocabulary-panel"><div className="vocabulary-filters"><label>Tìm từ<input type="search" placeholder="Kanji, kana, romaji hoặc nghĩa Việt" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label>Nhóm từ<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="all">Tất cả nhóm</option>{categories.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label></div><p className="hint">Hiển thị {entries.length} từ.</p><div className="vocabulary-table-wrap"><table><thead><tr><th>Từ</th><th>Kana</th><th>Romaji</th><th>Nghĩa Việt</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.vocabularyId}><td lang="ja">{entry.written}</td><td lang="ja">{entry.kana}</td><td>{entry.romaji}</td><td>{entry.meaningVi}</td></tr>)}</tbody></table></div></section></main>
}

export function QuizcardStudy({ subjectId, vocabulary, onBack, onAwardXp }: { subjectId: string; vocabulary: VocabularyBank; onBack: () => void; onAwardXp: (amount: 1 | 2) => void }) {
  const [queue, setQueue] = useState(() => createQuizcardQueue(vocabulary.entries))
  const [position, setPosition] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [result, setResult] = useState<1 | 2 | null>(null)
  const card = queue[position]

  function review(remembered: boolean) {
    if (!card || result !== null) return
    const xp = remembered ? 2 : 1
    recordVocabularyReview(subjectId, card.vocabularyId, remembered)
    onAwardXp(xp)
    setResult(xp)
  }

  function nextCard() {
    if (position + 1 < queue.length) { setPosition((current) => current + 1); setFlipped(false); setResult(null) }
  }

  function restart() { setQueue(createQuizcardQueue(vocabulary.entries)); setPosition(0); setFlipped(false); setResult(null) }

  if (!card) return null
  const completed = result !== null && position + 1 === queue.length
  return <main className="japanese-study-shell"><header className="japanese-study-header"><button className="text-button inline-button" type="button" onClick={onBack}>← Quay lại từ vựng</button><p className="eyebrow">JPD123 · Quizcard</p><h1>Học từ vựng từng thẻ</h1><p>Chỉ nhận XP một lần cho mỗi thẻ trong vòng này.</p></header><section className="quizcard-panel" aria-live="polite"><p className="eyebrow">Thẻ {position + 1}/{queue.length}</p><article className={flipped ? 'quizcard flipped' : 'quizcard'}><p className="quizcard-label">{flipped ? 'Phiên âm và nghĩa' : 'Tiếng Nhật'}</p><h2 lang="ja">{flipped ? card.kana : card.written}</h2>{flipped && <><p className="quizcard-romaji">{card.romaji}</p><p className="quizcard-meaning">{card.meaningVi}</p></>}</article>{!flipped && <button className="primary-button" type="button" onClick={() => setFlipped(true)}>Lật thẻ</button>}{flipped && result === null && <div className="quizcard-actions"><button className="text-button inline-button quizcard-back-button" type="button" onClick={() => setFlipped(false)}>← Xem lại tiếng Nhật</button><button className="primary-button" type="button" onClick={() => review(true)}>Tôi nhớ đúng · +2 XP</button><button className="secondary-button" type="button" onClick={() => review(false)}>Tôi chưa nhớ · +1 XP</button></div>}{result !== null && <><p className="quizcard-reward">Đã ghi nhận +{result} XP cho thẻ này.</p>{completed ? <button className="primary-button" type="button" onClick={restart}>Bắt đầu vòng mới</button> : <button className="primary-button" type="button" onClick={nextCard}>Thẻ tiếp theo →</button>}</>}</section></main>
}
