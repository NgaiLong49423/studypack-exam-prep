import { useEffect, useState } from 'react'
import './App.css'
import { loadJpd123Questions, loadJpd123Subject } from './content'
import { gradeAnswer, saveAttempt, selectPracticeQuestions } from './practice'
import type { Question, Subject } from './types'

type Screen = 'loading' | 'subject' | 'practice' | 'complete' | 'error'

function textOf(blocks: { text: string }[]) {
  return blocks.map((block) => block.text).join('\n')
}

function App() {
  const [screen, setScreen] = useState<Screen>('loading')
  const [subject, setSubject] = useState<Subject | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [session, setSession] = useState<Question[]>([])
  const [position, setPosition] = useState(0)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([loadJpd123Subject(), loadJpd123Questions()])
      .then(([loadedSubject, bank]) => {
        setSubject(loadedSubject)
        setQuestions(bank.questions)
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

  function startPractice() {
    setSession(selectPracticeQuestions(questions))
    setPosition(0)
    setCorrectCount(0)
    setSelectedOptionId(null)
    setScreen('practice')
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
          <button className="primary-button" type="button" onClick={startPractice}>Bắt đầu luyện 10 câu</button>
          <p className="hint">Lựa chọn đầu tiên sẽ được khóa ngay và bạn tự bấm Tiếp tục.</p>
        </section>
      </main>
    )
  }

  if (screen === 'complete') {
    return (
      <main className="app-shell">
        <section className="subject-card result-card" aria-labelledby="result-title">
          <p className="eyebrow">Hoàn thành lượt luyện</p>
          <h1 id="result-title">{correctCount}/{session.length} câu đúng</h1>
          <p>Kết quả từng câu đã được lưu trong trình duyệt của bạn. Thống kê tổng hợp sẽ có ở lát cắt tiếp theo.</p>
          <button className="primary-button" type="button" onClick={startPractice}>Luyện thêm 10 câu</button>
          <button className="text-button" type="button" onClick={() => setScreen('subject')}>Quay lại chọn môn</button>
        </section>
      </main>
    )
  }

  if (!question) return null

  return (
    <main className="practice-shell">
      <header className="practice-header">
        <span>{subject?.code} · Practice</span>
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
            <button className="primary-button" type="button" onClick={continuePractice}>Tiếp tục</button>
          </section>
        )}
      </section>
    </main>
  )
}

export default App
