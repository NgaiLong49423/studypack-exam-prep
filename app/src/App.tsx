import { useEffect, useState } from 'react'
import './App.css'
import { loadJpd123Exams, loadJpd123NotebookDocuments, loadJpd123Questions, loadJpd123Subject } from './content'
import { examAttempts, examScore, resolveExamItems } from './exam'
import { copyPromptToClipboard, createAiTutorPrompt } from './ai-tutor'
import { downloadFile, fullGeminiPack, learningProgressMarkdown, createExportContext } from './gemini-export'
import { gradeAnswer, saveAttempt, saveAttempts, selectPracticeQuestions, selectRandomQuestions, selectReviewQuestions, selectUnseenQuestions } from './practice'
import { clearAttempts, loadAttempts, seedStatisticsDemo } from './practice'
import { questionsByStatus, summarizeQuestions, type LearningStatus } from './statistics'
import type { Exam, Question, Subject } from './types'

type Screen = 'loading' | 'subject' | 'mode' | 'practice' | 'practice-empty' | 'complete' | 'statistics' | 'exam-list' | 'exam' | 'exam-result' | 'error'
type PracticeMode = 'smart' | 'random' | 'unseen' | 'review'

function textOf(blocks: { text: string }[]) {
  return blocks.map((block) => block.text).join('\n')
}

function App() {
  const [screen, setScreen] = useState<Screen>('loading')
  const [subject, setSubject] = useState<Subject | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [notebookDocuments, setNotebookDocuments] = useState({ subjectContext: '', tutorRules: '' })
  const [selectedGeminiExamIds, setSelectedGeminiExamIds] = useState<string[]>([])
  const [geminiExportStatus, setGeminiExportStatus] = useState('')
  const [aiTutorStatus, setAiTutorStatus] = useState('')
  const [showNotebookFallback, setShowNotebookFallback] = useState(false)
  const [exam, setExam] = useState<Exam | null>(null)
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({})
  const [session, setSession] = useState<Question[]>([])
  const [position, setPosition] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('smart')
  const [error, setError] = useState('')
  const [, setStatisticsRevision] = useState(0)
  const [detailStatus, setDetailStatus] = useState<LearningStatus | null>(null)

  useEffect(() => {
    Promise.all([loadJpd123Subject(), loadJpd123Questions(), loadJpd123Exams(), loadJpd123NotebookDocuments()])
      .then(([loadedSubject, bank, loadedExams, loadedNotebookDocuments]) => {
        setSubject(loadedSubject)
        setQuestions(bank.questions)
        setExams(loadedExams)
        setNotebookDocuments(loadedNotebookDocuments)
        setScreen('subject')
      })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Đã xảy ra lỗi không xác định.')
        setScreen('error')
      })
  }, [])

  const question = session[position]
  const isLocked = selectedOptionId !== null
  const isCorrect = question && selectedOptionId ? gradeAnswer(question, selectedOptionId) : false

  function startPractice(mode: PracticeMode) {
    setPracticeMode(mode)
    const attempts = loadAttempts()
    const selected = mode === 'smart' ? selectPracticeQuestions(questions, attempts)
      : mode === 'random' ? selectRandomQuestions(questions)
        : mode === 'unseen' ? selectUnseenQuestions(questions, attempts)
          : selectReviewQuestions(questions, attempts)
    setSession(selected)
    setPosition(0)
    setCorrectCount(0)
    setSelectedOptionId(null)
    setScreen(selected.length ? 'practice' : 'practice-empty')
  }

  function chooseAnswer(optionId: string) {
    if (!question || isLocked) return

    const correct = gradeAnswer(question, optionId)
    setSelectedOptionId(optionId)
    setCorrectCount((current) => current + Number(correct))
    saveAttempt({
      questionId: question.id,
      questionVersion: question.version,
      selectedOptionId: optionId,
      isCorrect: correct,
      answeredAt: new Date().toISOString(),
    })
  }

  function continuePractice() {
    if (position + 1 >= session.length) {
      setScreen('complete')
      return
    }
    setPosition((current) => current + 1)
    setSelectedOptionId(null)
  }

  function submitExam() {
    if (!exam) return
    const items = resolveExamItems(exam, questions)
    saveAttempts(examAttempts(exam, items, examAnswers, new Date().toISOString()))
    setStatisticsRevision((value) => value + 1)
    setScreen('exam-result')
  }

  async function exportGeminiPack() {
    if (!subject) return
    const selectedExams = exams.filter((item) => selectedGeminiExamIds.includes(item.examId))
    const pack = await fullGeminiPack(subject, questions, loadAttempts(), exams, selectedExams, notebookDocuments)
    downloadFile(pack.blob, pack.filename)
    setGeminiExportStatus(`Đã tải Gemini Pack${selectedExams.length ? ` kèm ${selectedExams.length} đề` : ''}.`)
  }

  function refreshLearningProgress() {
    if (!subject) return
    const context = createExportContext(subject.subjectId)
    const markdown = learningProgressMarkdown(subject, questions, loadAttempts(), context)
    downloadFile(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }), `studypack-${subject.subjectId}-learning-progress.md`)
    setGeminiExportStatus('Đã tải learning-progress.md mới nhất.')
  }

  async function askAi(questionForTutor: Question, examContext?: { title: string; questionNumber: number }) {
    if (!subject) return
    const copied = await copyPromptToClipboard(createAiTutorPrompt(subject, questionForTutor, examContext))
    if (!copied) {
      setAiTutorStatus('Trình duyệt chưa thể sao chép prompt. Hãy cho phép quyền Clipboard rồi thử lại.')
      return
    }
    const notebookUrl = subject.aiTutor?.enabled ? subject.aiTutor.notebookUrl : null
    if (!notebookUrl) {
      setShowNotebookFallback(false)
      setAiTutorStatus('Đã sao chép prompt. Notebook Gemini của môn này chưa được cấu hình, hãy mở Gemini và dán prompt.')
      return
    }
    const opened = window.open(notebookUrl, '_blank', 'noopener,noreferrer')
    setShowNotebookFallback(!opened)
    setAiTutorStatus(opened ? 'Đã sao chép prompt và mở Gemini Notebook.' : 'Đã sao chép prompt. Trình duyệt chặn cửa sổ mới, hãy bấm Mở Gemini Notebook.')
  }

  function openNotebook() {
    const notebookUrl = subject?.aiTutor?.enabled ? subject.aiTutor.notebookUrl : null
    if (notebookUrl) window.open(notebookUrl, '_blank', 'noopener,noreferrer')
  }

  if (screen === 'loading') return <main className="center-message">Đang tải StudyPack…</main>
  if (screen === 'error') return <main className="center-message error-message">{error}</main>

  if (screen === 'subject' && subject) {
    return (
      <main className="app-shell">
        <section className="subject-card" aria-labelledby="subject-title">
          <p className="eyebrow">Chọn môn để bắt đầu</p>
          <h1 id="subject-title">{subject.code}</h1>
          <h2>{subject.name}</h2>
          <p>{subject.description}</p>
          <dl className="subject-facts">
            <div><dt>Ngân hàng câu hỏi</dt><dd>{questions.length} câu</dd></div>
            <div><dt>Chế độ hiện có</dt><dd>Practice</dd></div>
          </dl>
          <button className="primary-button" type="button" onClick={() => setScreen('mode')}>Chọn cách luyện</button>
          <button className="text-button" type="button" onClick={() => setScreen('statistics')}>Xem thống kê học tập</button>
          <p className="hint">Lựa chọn đầu tiên sẽ được khóa ngay và bạn tự bấm Tiếp tục.</p>
        </section>
      </main>
    )
  }

  if (screen === 'mode') return <main className="app-shell"><section className="subject-card" aria-labelledby="mode-title">
    <p className="eyebrow">JPD123 · Practice</p><h1 id="mode-title">Bạn muốn luyện thế nào?</h1>
    <div className="mode-list"><button type="button" onClick={() => startPractice('smart')}><strong>Luyện thông minh</strong><span>Ưu tiên câu cần ôn theo tiến độ của bạn.</span></button><button type="button" onClick={() => startPractice('random')}><strong>Ngẫu nhiên toàn bộ</strong><span>Chọn đều từ toàn bộ ngân hàng câu hỏi.</span></button><button type="button" onClick={() => startPractice('unseen')}><strong>Chỉ câu chưa ôn</strong><span>Chỉ lấy câu bạn chưa từng trả lời.</span></button><button type="button" onClick={() => startPractice('review')}><strong>Câu cần ôn lại</strong><span>Đã làm ít nhất 1 lần và hiện đúng từ 50% trở xuống.</span></button><button type="button" onClick={() => setScreen('exam-list')}><strong>Luyện theo đề thi</strong><span>Giữ thứ tự đề, đổi đáp án trước khi nộp.</span></button></div>
    <button className="text-button" type="button" onClick={() => setScreen('subject')}>Quay lại chọn môn</button>
  </section></main>

  if (screen === 'practice-empty') return <main className="app-shell"><section className="subject-card result-card"><p className="eyebrow">Chưa có câu phù hợp</p><h1>{practiceMode === 'unseen' ? 'Bạn đã ôn hết các câu hiện có' : 'Chưa có câu nào cần ôn lại'}</h1><p>{practiceMode === 'unseen' ? 'Hãy chọn một cách luyện khác hoặc xóa thống kê nếu bạn muốn bắt đầu lại từ đầu.' : 'Hãy làm thêm câu hỏi hoặc xem Statistics để kiểm tra tiến độ hiện tại.'}</p><button className="primary-button" type="button" onClick={() => setScreen('mode')}>Chọn cách luyện khác</button><button className="text-button" type="button" onClick={() => setScreen('statistics')}>Xem thống kê học tập</button></section></main>

  if (screen === 'exam-list') return <main className="app-shell"><section className="subject-card"><p className="eyebrow">JPD123 · Exam</p><h1>Chọn đề thi</h1><div className="mode-list">{exams.map((item) => <button key={item.examId} type="button" onClick={() => { setExam(item); setExamAnswers({}); setScreen('exam') }}><strong>{item.title}</strong><span>{item.declaredQuestionCount} câu · FE SP26</span></button>)}</div><button className="text-button" type="button" onClick={() => setScreen('mode')}>Quay lại</button></section></main>

  if (screen === 'exam' && exam) {
    const examItemsInOrder = resolveExamItems(exam, questions)
    return <main className="practice-shell"><header className="practice-header"><span>{exam.title}</span><span>{Object.keys(examAnswers).length}/{examItemsInOrder.length} đã trả lời</span></header>{examItemsInOrder.map(({ item, question }, index) => <section className="question-card exam-question" key={item.examItemId}><p className="eyebrow">Câu {index + 1}</p><h2 className="question-text">{textOf(question.blocks)}</h2><div className="answers">{question.options.map((option, optionIndex) => <button className={`answer-button${examAnswers[item.examItemId] === option.id ? ' selected' : ''}`} key={option.id} type="button" onClick={() => setExamAnswers((current) => ({ ...current, [item.examItemId]: option.id }))}><span className="option-label">{String.fromCharCode(65 + optionIndex)}</span><span>{textOf(option.blocks)}</span></button>)}</div></section>)}<button className="primary-button" type="button" onClick={submitExam}>Nộp bài</button></main>
  }

  if (screen === 'exam-result' && exam) {
    const items = resolveExamItems(exam, questions); const score = examScore(examAnswers, items)
    return <main className="app-shell"><section className="subject-card result-card"><p className="eyebrow">Kết quả đề thi</p><h1>{score.correct}/{items.length} câu đúng</h1><p>Tỉ lệ đúng: {score.percent}% · Chưa trả lời: {score.unanswered}</p><section className="exam-review" aria-label="Xem lại đáp án và lời giải"><h2>Xem lại từng câu</h2>{items.map(({ item, question }, index) => { const selectedOptionId = examAnswers[item.examItemId]; const selectedOption = question.options.find((option) => option.id === selectedOptionId); const correctOption = question.options.find((option) => question.correctAnswerIds.includes(option.id)); const state = !selectedOptionId ? 'unanswered' : selectedOptionId === correctOption?.id ? 'correct' : 'incorrect'; const label = state === 'correct' ? 'Đúng' : state === 'incorrect' ? 'Sai' : 'Chưa trả lời'; return <article className={`review-item review-${state}`} key={item.examItemId}><p className="eyebrow">Câu {index + 1} · {label}</p><h3>{textOf(question.blocks)}</h3><p><strong>Bạn chọn:</strong> {selectedOption ? textOf(selectedOption.blocks) : 'Chưa trả lời'}</p><p><strong>Đáp án đúng:</strong> {correctOption ? textOf(correctOption.blocks) : 'Chưa có dữ liệu'}</p>{question.explanation && <div className="review-explanation"><strong>Lời giải</strong><p>{textOf(question.explanation.blocks)}</p></div>}<button className="secondary-button" type="button" onClick={() => void askAi(question, { title: exam.title, questionNumber: index + 1 })}>Hỏi AI để hiểu kỹ câu này</button></article> })}</section>{aiTutorStatus && <p className="ai-tutor-status" aria-live="polite">{aiTutorStatus}</p>}{showNotebookFallback && <button className="text-button" type="button" onClick={openNotebook}>Mở Gemini Notebook</button>}<button className="primary-button" type="button" onClick={() => { setExam(null); setScreen('exam-list') }}>Chọn đề khác</button><button className="text-button" type="button" onClick={() => setScreen('statistics')}>Xem thống kê học tập</button><button className="text-button" type="button" onClick={() => setScreen('subject')}>Quay lại chọn môn</button></section></main>
  }

  if (screen === 'complete') {
    return (
      <main className="app-shell">
        <section className="subject-card result-card" aria-labelledby="result-title">
          <p className="eyebrow">Hoàn thành lượt luyện</p>
          <h1 id="result-title">{correctCount}/{session.length} câu đúng</h1>
          <p>Kết quả từng câu đã được lưu trong trình duyệt của bạn và đã phản ánh vào Statistics.</p>
          <button className="primary-button" type="button" onClick={() => startPractice(practiceMode)}>Luyện thêm 10 câu</button>
          <button className="text-button" type="button" onClick={() => setScreen('subject')}>Quay lại chọn môn</button>
          <button className="text-button" type="button" onClick={() => setScreen('statistics')}>Xem thống kê</button>
        </section>
      </main>
    )
  }

  if (screen === 'statistics') {
    const summary = summarizeQuestions(questions, loadAttempts())
    const labels = { not_practiced: 'Chưa ôn', learning: 'Đang học', weak: 'Yếu', developing: 'Đang phát triển', stable: 'Ổn', mastered: 'Thành thạo' }
    const rules = { not_practiced: '0 lần trả lời', learning: '1–3 lần trả lời', weak: 'Từ 4 lần, đúng ≤ 50%', developing: 'Từ 4 lần, đúng > 50% đến 75%', stable: 'Từ 4 lần, đúng > 75% đến < 90%', mastered: 'Từ 4 lần, đúng ≥ 90%' }
    const detailedQuestions = detailStatus ? questionsByStatus(questions, loadAttempts(), detailStatus) : []
    const resetStatistics = () => {
      if (window.confirm('Xóa toàn bộ lịch sử trả lời JPD123 trên trình duyệt này? Bạn sẽ bắt đầu lại từ đầu.')) {
        clearAttempts()
        setDetailStatus(null)
        setStatisticsRevision((value) => value + 1)
      }
    }
    const loadDemo = () => {
      seedStatisticsDemo(questions.slice(0, 6).map((question) => question.id))
      setDetailStatus(null)
      setStatisticsRevision((value) => value + 1)
    }
    return <main className="app-shell"><section className="subject-card" aria-labelledby="statistics-title">
      <p className="eyebrow">JPD123 · Statistics</p><h1 id="statistics-title">Tiến độ học tập</h1>
      <dl className="subject-facts"><div><dt>Lượt trả lời</dt><dd>{summary.totalAttempts}</dd></div><div><dt>Tỉ lệ đúng</dt><dd>{summary.accuracy}%</dd></div></dl>
      <div className="statistics-list">{Object.entries(summary.counts).map(([key, count]) => { const status = key as LearningStatus; return <div key={key}><span><strong>{labels[status]}</strong><small>{rules[status]}</small></span><button type="button" className="text-button" onClick={() => setDetailStatus(status)}>Xem chi tiết · {count} câu</button></div> })}</div>
      {detailStatus && <section className="detail-list" aria-live="polite"><h2>{labels[detailStatus]} · {detailedQuestions.length} câu</h2>{detailedQuestions.map((question) => { const ownAttempts = loadAttempts().filter((attempt) => attempt.questionId === question.id); const correct = ownAttempts.filter((attempt) => attempt.isCorrect).length; return <article key={question.id}><strong>{question.id}</strong><p>{textOf(question.blocks)}</p><small>{ownAttempts.length} lần làm · {correct} đúng · {ownAttempts.length ? Math.round((correct / ownAttempts.length) * 100) : 0}%</small></article> })}</section>}
      <section className="gemini-documents" aria-labelledby="gemini-documents-title"><p className="eyebrow">Gemini Learning Documents</p><h2 id="gemini-documents-title">Xuất tài liệu để đưa vào Gemini</h2><p>Gói chỉ là snapshot đọc-only. Kết quả trong Gemini không tự thay đổi Statistics của app; bạn có thể tự thêm theory Markdown vào Notebook.</p><fieldset><legend>Đính kèm đề thi (tùy chọn)</legend>{exams.map((item) => <label key={item.examId}><input type="checkbox" checked={selectedGeminiExamIds.includes(item.examId)} onChange={() => setSelectedGeminiExamIds((current) => current.includes(item.examId) ? current.filter((id) => id !== item.examId) : [...current, item.examId])} /> {item.title} · {item.items.length} câu</label>)}</fieldset><button className="primary-button" type="button" onClick={() => void exportGeminiPack()}>Tải Full Gemini Pack (.zip)</button><button className="text-button" type="button" onClick={refreshLearningProgress}>Tải learning-progress.md mới nhất</button>{geminiExportStatus && <p className="export-status" aria-live="polite">{geminiExportStatus}</p>}</section>
      <button className="danger-button" type="button" onClick={resetStatistics}>Xóa dữ liệu thống kê và ôn lại từ đầu</button>
      {import.meta.env.DEV && <button className="demo-button" type="button" onClick={loadDemo}>Nạp dữ liệu demo Statistics (chỉ local)</button>}
      <button className="text-button" type="button" onClick={() => setScreen('subject')}>Quay lại chọn môn</button>
    </section></main>
  }

  if (!question) return null

  return (
    <main className="practice-shell">
      <header className="practice-header">
        <span>{subject?.code} · {{ smart: 'Luyện thông minh', random: 'Ngẫu nhiên toàn bộ', unseen: 'Chỉ câu chưa ôn', review: 'Câu cần ôn lại' }[practiceMode]}</span>
        <span>Câu {position + 1}/{session.length}</span>
      </header>
      <section className="question-card" aria-labelledby="question-title">
        <p className="eyebrow">{question.id}</p>
        <h1 id="question-title" className="question-text">{textOf(question.blocks)}</h1>
        <div className="answers" aria-label="Các đáp án">
          {question.options.map((option, index) => {
            const isSelected = selectedOptionId === option.id
            const isAnswer = question.correctAnswerIds.includes(option.id)
            const state = isLocked ? (isAnswer ? ' correct' : isSelected ? ' incorrect' : '') : ''
            return (
              <button className={`answer-button${state}`} disabled={isLocked} key={option.id} type="button" onClick={() => chooseAnswer(option.id)}>
                <span className="option-label">{String.fromCharCode(65 + index)}</span>
                <span>{textOf(option.blocks)}</span>
              </button>
            )
          })}
        </div>
        {isLocked && (
          <section className={`feedback ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`} aria-live="polite">
            <h2>{isCorrect ? 'Đúng rồi' : 'Chưa đúng'}</h2>
            <p>{textOf(question.explanation?.blocks ?? [])}</p>
            {subject?.aiTutor?.enabled && <button className="secondary-button" type="button" onClick={() => void askAi(question)}>Hỏi AI để hiểu kỹ câu này</button>}
            {aiTutorStatus && <p className="ai-tutor-status" aria-live="polite">{aiTutorStatus}</p>}
            {showNotebookFallback && <button className="text-button" type="button" onClick={openNotebook}>Mở Gemini Notebook</button>}
            <button className="primary-button" type="button" onClick={continuePractice}>Tiếp tục</button>
          </section>
        )}
      </section>
    </main>
  )
}

export default App
