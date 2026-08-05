import { useMemo, useState } from 'react'
import type { PracticeMode, PracticeSession, ReadingDocument, VocabularyBank } from './types'
import { createQuizcardQueue, recordVocabularyReview } from './vocabulary-progress'
import { createPracticeSession, gradeAnswer, restorePracticeQuestions, selectPracticeQuestions, selectRandomQuestions, selectReviewQuestions, selectUnseenQuestions } from './practice'
import { summarizeQuestions } from './statistics'
import { clearVocabularyAttempts, clearVocabularySession, loadVocabularyAttempts, loadVocabularySession, saveVocabularyAttempt, saveVocabularySession, vocabularyQuestions, vocabularySessionSubjectId } from './vocabulary-practice'

const textOf = (blocks: { text: string }[]) => blocks.map((block) => block.text).join('\n')

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

export function VocabularyStudy({ vocabulary, onBack, onStartQuizcard, onStartPractice }: { vocabulary: VocabularyBank; onBack: () => void; onStartQuizcard: () => void; onStartPractice: () => void }) {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const categories = useMemo(() => [...new Map(vocabulary.entries.map((entry) => [entry.categoryId, entry.categoryName])).entries()], [vocabulary.entries])
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const entries = vocabulary.entries.filter((entry) => (categoryId === 'all' || entry.categoryId === categoryId) && (!normalizedQuery || [entry.written, entry.kana, entry.romaji, entry.meaningVi].some((value) => value.toLocaleLowerCase().includes(normalizedQuery))))
  return <main className="japanese-study-shell"><header className="japanese-study-header"><button className="text-button inline-button" type="button" onClick={onBack}>← Quay lại môn học</button><p className="eyebrow">JPD123 · Từ vựng</p><h1>Từ Hán, kana và nghĩa Việt</h1><p>{vocabulary.entries.length} từ vựng từ tài liệu ôn thi.</p><div className="resume-actions"><button className="primary-button" type="button" onClick={onStartQuizcard}>Bắt đầu Quizcard</button><button className="secondary-button" type="button" onClick={onStartPractice}>Trắc nghiệm phiên âm</button></div></header><section className="vocabulary-panel"><div className="vocabulary-filters"><label>Tìm từ<input type="search" placeholder="Kanji, kana, romaji hoặc nghĩa Việt" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label>Nhóm từ<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="all">Tất cả nhóm</option>{categories.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label></div><p className="hint">Hiển thị {entries.length} từ.</p><div className="vocabulary-table-wrap"><table><thead><tr><th>Từ</th><th>Kana</th><th>Romaji</th><th>Nghĩa Việt</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.vocabularyId}><td lang="ja">{entry.written}</td><td lang="ja">{entry.kana}</td><td>{entry.romaji}</td><td>{entry.meaningVi}</td></tr>)}</tbody></table></div></section></main>
}

export function VocabularyPractice({ subjectId, vocabulary, onBack }: { subjectId: string; vocabulary: VocabularyBank; onBack: () => void }) {
  const practiceSubjectId = vocabularySessionSubjectId(subjectId)
  const questions = useMemo(() => vocabularyQuestions(practiceSubjectId, vocabulary.entries), [practiceSubjectId, vocabulary.entries])
  const [mode, setMode] = useState<PracticeMode>('smart'); const [session, setSession] = useState<PracticeSession | null>(() => loadVocabularySession(practiceSubjectId)); const [position, setPosition] = useState(0); const [selected, setSelected] = useState<string[]>([]); const [locked, setLocked] = useState(false); const [correctCount, setCorrectCount] = useState(0); const [view, setView] = useState<'modes' | 'practice' | 'complete' | 'statistics'>(() => loadVocabularySession(practiceSubjectId) ? 'modes' : 'modes')
  const activeQuestions = session ? restorePracticeQuestions(session, questions) ?? [] : []
  const question = activeQuestions[position]; const correct = question && locked ? gradeAnswer(question, selected) : false
  const start = (nextMode: PracticeMode) => { const attempts = loadVocabularyAttempts(practiceSubjectId); const picked = nextMode === 'smart' ? selectPracticeQuestions(questions, attempts) : nextMode === 'random' ? selectRandomQuestions(questions) : nextMode === 'unseen' ? selectUnseenQuestions(questions, attempts) : selectReviewQuestions(questions, attempts); if (!picked.length) return; const next = createPracticeSession(practiceSubjectId, nextMode, picked); setMode(nextMode); setSession(next); saveVocabularySession(next); setPosition(0); setSelected([]); setLocked(false); setCorrectCount(0); setView('practice') }
  const resume = () => { if (!session || !activeQuestions.length) { clearVocabularySession(practiceSubjectId); setSession(null); return } setMode(session.mode); setPosition(session.position); setSelected(session.selectedOptionIds); setLocked(session.isLocked); setCorrectCount(session.correctCount); setView('practice') }
  const answer = (id: string) => { if (!question || locked) return; setSelected([id]) }
  const submit = () => { if (!question || locked || !selected.length || !session) return; const isCorrect = gradeAnswer(question, selected); const next = { ...session, selectedOptionIds: selected, isLocked: true, correctCount: session.correctCount + Number(isCorrect), updatedAt: new Date().toISOString() }; setSession(next); saveVocabularySession(next); saveVocabularyAttempt(practiceSubjectId, { questionId: question.id, questionVersion: 1, selectedOptionId: selected[0], selectedOptionIds: selected, isCorrect, answeredAt: new Date().toISOString() }); setCorrectCount(next.correctCount); setLocked(true) }
  const next = () => { if (!session) return; if (position + 1 >= activeQuestions.length) { clearVocabularySession(practiceSubjectId); setSession(null); setView('complete'); return } const updated = { ...session, position: position + 1, selectedOptionIds: [], isLocked: false, updatedAt: new Date().toISOString() }; setSession(updated); saveVocabularySession(updated); setPosition(updated.position); setSelected([]); setLocked(false) }
  if (view === 'statistics') { const attempts = loadVocabularyAttempts(practiceSubjectId); const summary = summarizeQuestions(questions, attempts); const statuses = ['not_practiced', 'learning', 'weak', 'developing', 'stable', 'mastered'] as const; const labels = { not_practiced: 'Chưa ôn', learning: 'Đang học', weak: 'Yếu', developing: 'Đang phát triển', stable: 'Ổn', mastered: 'Thành thạo' }; return <main className="japanese-study-shell"><header className="japanese-study-header"><button className="text-button inline-button" type="button" onClick={onBack}>← Quay lại từ vựng</button><p className="eyebrow">JPD123 · Trắc nghiệm từ vựng</p><h1>Thống kê phiên âm</h1><p>{summary.totalAttempts} lượt trả lời · Tỷ lệ đúng {summary.accuracy}%.</p></header><section className="vocabulary-panel"><div className="statistics-list">{statuses.map(status => <div className="statistics-card" key={status}><strong>{labels[status]}</strong><small>{summary.counts[status]} từ</small></div>)}</div><button className="danger-button" type="button" onClick={() => { clearVocabularyAttempts(practiceSubjectId); setView('modes') }}>Xóa thống kê từ vựng</button><button className="text-button" type="button" onClick={() => setView('modes')}>Quay lại</button></section></main> }
  if (view === 'complete') return <main className="japanese-study-shell"><section className="quizcard-panel"><p className="eyebrow">Hoàn thành lượt luyện</p><h1>{correctCount}/{activeQuestions.length || 20} câu đúng</h1><button className="primary-button" type="button" onClick={() => start(mode)}>Luyện vòng mới</button><button className="text-button" type="button" onClick={() => setView('statistics')}>Xem thống kê</button></section></main>
  if (view === 'practice' && question) { const ref = session?.questionRefs[position]; const options = ref?.optionOrder ? ref.optionOrder.map(id => question.options.find(option => option.id === id)!).filter(Boolean) : question.options; return <main className="japanese-study-shell"><header className="practice-header"><span>JPD123 · Trắc nghiệm phiên âm</span><span>Câu {position + 1}/{activeQuestions.length}</span></header><section className="question-card"><p className="eyebrow">Chọn phiên âm đúng</p><h1 className="question-text" lang="ja">{textOf(question.blocks)}</h1><div className="answers">{options.map((option, index) => <button key={option.id} type="button" disabled={locked} className={`answer-button${locked ? (question.correctAnswerIds.includes(option.id) ? ' correct' : selected.includes(option.id) ? ' incorrect' : '') : selected.includes(option.id) ? ' selected' : ''}`} onClick={() => answer(option.id)}><span className="option-label">{String.fromCharCode(65 + index)}</span><span className="answer-content">{textOf(option.blocks)}</span></button>)}</div>{!locked ? <button className="primary-button" type="button" disabled={!selected.length} onClick={submit}>Xác nhận đáp án</button> : <section className={`feedback ${correct ? 'feedback-correct' : 'feedback-incorrect'}`}><h2>{correct ? 'Đúng rồi' : 'Chưa đúng'}</h2><p>{textOf(question.explanation?.blocks ?? [])}</p><button className="primary-button" type="button" onClick={next}>Tiếp tục</button></section>}</section></main> }
  return <main className="japanese-study-shell"><header className="japanese-study-header"><button className="text-button inline-button" type="button" onClick={onBack}>← Quay lại từ vựng</button><p className="eyebrow">JPD123 · Trắc nghiệm từ vựng</p><h1>Từ tiếng Nhật → phiên âm</h1><p>Lịch sử đúng/sai được lưu riêng và dùng để ưu tiên từ cần ôn.</p></header><section className="vocabulary-panel"><div className="mode-list"><button type="button" onClick={() => start('smart')}><strong>Luyện thông minh</strong><span>Ưu tiên từ có tỷ lệ đúng thấp.</span></button><button type="button" onClick={() => start('random')}><strong>Ngẫu nhiên toàn bộ</strong><span>20 từ không lặp trong lượt.</span></button><button type="button" onClick={() => start('unseen')}><strong>Chỉ từ chưa ôn</strong><span>Chỉ lấy từ chưa từng làm trắc nghiệm.</span></button><button type="button" onClick={() => start('review')}><strong>Từ cần ôn lại</strong><span>Từ đã làm và đúng từ 50% trở xuống.</span></button></div>{session && <button className="secondary-button" type="button" onClick={resume}>Tiếp tục lượt đang làm</button>}<button className="text-button" type="button" onClick={() => setView('statistics')}>Xem Statistics từ vựng</button></section></main>
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
