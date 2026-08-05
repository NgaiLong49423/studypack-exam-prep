import { useEffect, useRef, useState } from 'react'
import './App.css'
import { loadExams, loadJapaneseStudyContent, loadNotebookDocuments, loadQuestions, loadSubject, loadSubjectCatalog } from './content'
import { ReadingLibrary, VocabularyPractice, VocabularyStudy } from './japanese-study'
import { AdaptiveQuizcardStudy } from './adaptive-quizcard'
import { createMockExam, examAttempts, examScore, formatRemainingTime, MOCK_EXAM_MAX_QUESTION_COUNT, MOCK_EXAM_MIN_QUESTION_COUNT, resolveExamItems } from './exam'
import { copyPromptToClipboard, createAiTutorPrompt } from './ai-tutor'
import { clearTutorNotebookUrl, loadTutorNotebookUrl, saveTutorNotebookUrl } from './tutor-settings'
import { downloadFile, fullGeminiPack, learningProgressMarkdown, createExportContext } from './gemini-export'
import { clearAttempts, clearPracticeSession, createPracticeSession, extendPracticeSession, gradeAnswer, loadAttempts, loadPracticeSession, restorePracticeQuestions, saveAttempt, saveAttempts, savePracticeSession, selectPracticeQuestions, selectRandomQuestions, selectReviewQuestions, selectUnseenQuestions, seedStatisticsDemo } from './practice'
import { questionsByStatus, summarizeQuestions, type LearningStatus } from './statistics'
import { ACHIEVEMENTS, addXp, checkExamAchievements, checkLevelAchievements, checkMasteryAchievements, handlePracticeAnswer, loadProfile, xpForNextLevel, getLevelTitle, type UserProfile } from './gamification'
import type { Exam, PracticeMode, PracticeSession, Question, ReadingDocument, Subject, SubjectCatalogEntry, VocabularyBank } from './types'

type Screen = 'loading' | 'subject-picker' | 'subject' | 'mode' | 'practice' | 'practice-empty' | 'complete' | 'statistics' | 'exam-list' | 'mock-exam-setup' | 'exam' | 'exam-result' | 'reading' | 'vocabulary' | 'quizcard' | 'vocabulary-practice' | 'error' | 'profile'

function textOf(blocks: { text: string }[]) {
  return blocks.map((block) => block.text).join('\n')
}

function App() {
  const [screen, setScreen] = useState<Screen>('loading')
  const [subject, setSubject] = useState<Subject | null>(null)
  const [subjectCatalog, setSubjectCatalog] = useState<SubjectCatalogEntry[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [notebookDocuments, setNotebookDocuments] = useState({ subjectContext: '', tutorRules: '' })
  const [readingDocuments, setReadingDocuments] = useState<ReadingDocument[]>([])
  const [vocabulary, setVocabulary] = useState<VocabularyBank | null>(null)
  const [selectedGeminiExamIds, setSelectedGeminiExamIds] = useState<string[]>([])
  const [geminiExportStatus, setGeminiExportStatus] = useState('')
  const [aiTutorStatus, setAiTutorStatus] = useState('')
  const [showNotebookFallback, setShowNotebookFallback] = useState(false)
  const [personalNotebookUrl, setPersonalNotebookUrl] = useState('')
  const [savedNotebookUrl, setSavedNotebookUrl] = useState('')
  const [notebookSettingsStatus, setNotebookSettingsStatus] = useState('')
  const [exam, setExam] = useState<Exam | null>(null)
  const [examAnswers, setExamAnswers] = useState<Record<string, string[]>>({})
  const [mockQuestionCount, setMockQuestionCount] = useState(MOCK_EXAM_MIN_QUESTION_COUNT)
  const [mockDurationMinutes, setMockDurationMinutes] = useState(30)
  const [mockExamEndsAt, setMockExamEndsAt] = useState<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [wasAutoSubmitted, setWasAutoSubmitted] = useState(false)
  const examSubmissionLocked = useRef(false)
  const submitExamRef = useRef<(autoSubmitted?: boolean) => void>(() => {})
  const [session, setSession] = useState<Question[]>([])
  const [practiceSessionId, setPracticeSessionId] = useState('')
  const [activePracticeSession, setActivePracticeSession] = useState<PracticeSession | null>(null)
  const [resumeCandidate, setResumeCandidate] = useState<PracticeSession | null>(null)
  const [position, setPosition] = useState(0)
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
  const [isLocked, setIsLocked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('smart')
  const [error, setError] = useState('')
  const [, setStatisticsRevision] = useState(0)
  const [detailStatus, setDetailStatus] = useState<LearningStatus | null>(null)
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [toastMessages, setToastMessages] = useState<{ id: number, message: string }[]>([])
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('studypack:theme') as 'light' | 'dark') || 'light'
  })

  useEffect(() => {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
    else document.documentElement.removeAttribute('data-theme')
    localStorage.setItem('studypack:theme', theme)
  }, [theme])

  useEffect(() => {
    if (subject) {
      setProfile(loadProfile(subject.subjectId))
    } else {
      setProfile(null)
    }
  }, [subject])

  useEffect(() => {
    if (subject && questions.length > 0 && profile) {
      const summary = summarizeQuestions(questions, loadAttempts(subject.subjectId))
      const { profile: achProfile, unlockedIds } = checkMasteryAchievements(summary.counts.mastered, questions.length, profile)
      if (unlockedIds.length > 0) {
        setProfile(achProfile)
        checkAndShowAchievements(unlockedIds, achProfile)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, profile?.subjectId])

  const addToast = (msg: string) => {
    const id = Date.now() + Math.random()
    setToastMessages((prev) => [...prev, { id, message: msg }])
    setTimeout(() => setToastMessages((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  const checkAndShowAchievements = (unlockedIds: string[], newProfile: UserProfile) => {
    if (unlockedIds.length > 0) {
      unlockedIds.forEach(id => {
        const ach = ACHIEVEMENTS.find(a => a.id === id)
        if (ach) addToast(`🏆 Đạt thành tựu mới: ${ach.name}!`)
      })
    }
    setProfile(newProfile)
  }

  useEffect(() => {
    loadSubjectCatalog().then((catalog) => { setSubjectCatalog(catalog.subjects); setScreen('subject-picker') })
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : 'Đã xảy ra lỗi không xác định.')
        setScreen('error')
      })
  }, [])

  async function chooseSubject(entry: SubjectCatalogEntry) {
    if (entry.status !== 'published') return
    setScreen('loading')
    try {
      const [loadedSubject, bank, loadedExams, loadedNotebookDocuments, japaneseStudyContent] = await Promise.all([loadSubject(entry.subjectId), loadQuestions(entry.subjectId), loadExams(entry.subjectId, entry.examIds), loadNotebookDocuments(entry.subjectId), loadJapaneseStudyContent(entry.subjectId)])
      setSubject(loadedSubject)
      const savedUrl = loadTutorNotebookUrl(loadedSubject.subjectId)
      setPersonalNotebookUrl(savedUrl); setSavedNotebookUrl(savedUrl)
      setQuestions(bank.questions); setExams(loadedExams); setNotebookDocuments(loadedNotebookDocuments)
      setReadingDocuments(japaneseStudyContent.readingDocuments); setVocabulary(japaneseStudyContent.vocabulary)
      const savedSession = loadPracticeSession(loadedSubject.subjectId)
      const restoredQuestions = savedSession ? restorePracticeQuestions(savedSession, bank.questions) : null
      setResumeCandidate(savedSession && restoredQuestions ? savedSession : null)
      if (savedSession && !restoredQuestions) clearPracticeSession(loadedSubject.subjectId)
      setScreen('subject')
    } catch (reason: unknown) { setError(reason instanceof Error ? reason.message : 'Đã xảy ra lỗi không xác định.'); setScreen('error') }
  }

  const question = session[position]
  const isCorrect = question && isLocked ? gradeAnswer(question, selectedOptionIds) : false

  useEffect(() => {
    if (screen !== 'exam' || !mockExamEndsAt) return
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((mockExamEndsAt - Date.now()) / 1000))
      setRemainingSeconds(seconds)
      if (seconds === 0) submitExamRef.current(true)
    }
    tick()
    const timer = window.setInterval(tick, 250)
    return () => window.clearInterval(timer)
  }, [screen, mockExamEndsAt, exam, examAnswers, subject])

  function startPractice(mode: PracticeMode) {
    setPracticeMode(mode)
    const attempts = loadAttempts(subject?.subjectId ?? '')
    const selected = mode === 'smart' ? selectPracticeQuestions(questions, attempts)
      : mode === 'random' ? selectRandomQuestions(questions)
        : mode === 'unseen' ? selectUnseenQuestions(questions, attempts)
          : selectReviewQuestions(questions, attempts)
    setSession(selected)
    setPosition(0)
    setCorrectCount(0)
    setSelectedOptionIds([])
    setIsLocked(false)
    if (selected.length) {
      const nextSession = createPracticeSession(subject?.subjectId ?? '', mode, selected)
      setPracticeSessionId(nextSession.sessionId)
      setActivePracticeSession(nextSession)
      savePracticeSession(nextSession)
      setResumeCandidate(null)
      setScreen('practice')
    } else {
      setScreen('practice-empty')
    }
  }

  function persistPracticeSession(changes: Partial<PracticeSession> = {}) {
    if (!subject || !practiceSessionId || !session.length) return
    const current = loadPracticeSession(subject.subjectId)
    if (!current || current.sessionId !== practiceSessionId) return
    const updated = { ...current, ...changes, updatedAt: new Date().toISOString() }
    savePracticeSession(updated)
    setActivePracticeSession(updated)
  }

  function resumePractice() {
    if (!subject || !resumeCandidate) return
    const restored = restorePracticeQuestions(resumeCandidate, questions)
    if (!restored) {
      clearPracticeSession(subject.subjectId)
      setResumeCandidate(null)
      return
    }
    setSession(restored)
    setPracticeSessionId(resumeCandidate.sessionId)
    setActivePracticeSession(resumeCandidate)
    setPracticeMode(resumeCandidate.mode)
    setPosition(resumeCandidate.position)
    setSelectedOptionIds(resumeCandidate.selectedOptionIds)
    setIsLocked(resumeCandidate.isLocked)
    setCorrectCount(resumeCandidate.correctCount)
    setResumeCandidate(null)
    setScreen('practice')
  }

  function startNewPractice() {
    if (!subject) return
    clearPracticeSession(subject.subjectId)
    setResumeCandidate(null)
    setScreen('mode')
  }

  function submitPracticeAnswer(optionIds: string[]) {
    if (!question || isLocked || optionIds.length === 0) return
    const correct = gradeAnswer(question, optionIds)
    setSelectedOptionIds(optionIds)
    setIsLocked(true)
    setCorrectCount((current) => current + Number(correct))
    
    if (!subject || !profile) return
    const { profile: updatedProfile, xpAdded, levelUp, unlockedIds: practiceUnlockedIds } = handlePracticeAnswer(subject.subjectId, correct)
    let newProfile = updatedProfile
    
    if (correct) {
      if (updatedProfile.currentStreak > 1) {
        addToast(`🔥 Combo x${updatedProfile.currentStreak}! (+${xpAdded} EXP)`)
      } else {
        addToast(`✅ +${xpAdded} EXP`)
      }
    } else {
      addToast(`❌ +${xpAdded} EXP`)
    }
    
    if (levelUp) addToast(`⭐ Lên cấp ${newProfile.level}!`)
    const { profile: achProfile, unlockedIds: levelUnlockedIds } = checkLevelAchievements(newProfile)
    checkAndShowAchievements([...practiceUnlockedIds, ...levelUnlockedIds], achProfile)

    saveAttempt(subject?.subjectId ?? '', {
      questionId: question.id,
      questionVersion: question.version,
      selectedOptionId: optionIds.length === 1 ? optionIds[0] : null,
      selectedOptionIds: optionIds,
      isCorrect: correct,
      answeredAt: new Date().toISOString(),
    })
    persistPracticeSession({ selectedOptionIds: optionIds, isLocked: true, correctCount: correctCount + Number(correct) })
  }

  function chooseAnswer(optionId: string) {
    if (!question || isLocked) return
    const nextSelection = question.maxSelections === 1
      ? [optionId]
      : selectedOptionIds.includes(optionId)
        ? selectedOptionIds.filter((id) => id !== optionId)
        : selectedOptionIds.length < question.maxSelections ? [...selectedOptionIds, optionId] : selectedOptionIds
    setSelectedOptionIds(nextSelection)
    persistPracticeSession({ selectedOptionIds: nextSelection })
  }

  function continuePractice() {
    if (!subject) return
    let nextQuestions = session

    if (position + 1 >= session.length && activePracticeSession) {
      const extended = extendPracticeSession(activePracticeSession, questions, loadAttempts(subject?.subjectId ?? ''))
      if (extended.questionRefs.length > activePracticeSession.questionRefs.length) {
        const restored = restorePracticeQuestions(extended, questions)
        if (restored) {
          nextQuestions = restored
          setSession(restored)
          setActivePracticeSession(extended)
          savePracticeSession(extended)
        }
      }
    }

    if (position + 1 >= nextQuestions.length) {
      if (subject) clearPracticeSession(subject.subjectId)
      
      const { profile: newProfile, levelUp } = addXp(loadProfile(subject.subjectId), 50)
      addToast(`🏆 Hoàn thành block luyện tập! +50 EXP`)
      if (levelUp) addToast(`⭐ Lên cấp ${newProfile.level}!`)
      const { profile: achProfile, unlockedIds } = checkLevelAchievements(newProfile)
      checkAndShowAchievements(unlockedIds, achProfile)
      setProfile(achProfile)

      setScreen('complete')
      return
    }

    const nextPosition = position + 1
    setPosition(nextPosition)
    // persistPracticeSession uses loadPracticeSession, which will get the latest saved session (e.g. extended)
    persistPracticeSession({ position: nextPosition, selectedOptionIds: [], isLocked: false })
    setSelectedOptionIds([])
    setIsLocked(false)
  }

  function openExam(nextExam: Exam, endsAt: number | null = null) {
    examSubmissionLocked.current = false
    setExam(nextExam)
    setExamAnswers({})
    setMockExamEndsAt(endsAt)
    setRemainingSeconds(endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0)
    setWasAutoSubmitted(false)
    setScreen('exam')
  }

  function startMockExam() {
    if (!subject) return
    const duration = Math.floor(mockDurationMinutes)
    if (!Number.isFinite(duration) || duration < 1) return
    const mock = createMockExam(subject.subjectId, questions, mockQuestionCount)
    if (mock.items.length === 0) return
    openExam(mock, Date.now() + duration * 60_000)
  }

  function submitExam(autoSubmitted = false) {
    if (!exam || !subject || examSubmissionLocked.current) return
    examSubmissionLocked.current = true
    const items = resolveExamItems(exam, questions)
    saveAttempts(subject?.subjectId ?? '', examAttempts(exam, items, examAnswers, new Date().toISOString()))
    setWasAutoSubmitted(autoSubmitted)
    setMockExamEndsAt(null)
    setStatisticsRevision((value) => value + 1)
    setScreen('exam-result')

    const score = examScore(examAnswers, items)
    const { profile: newProfile, levelUp } = addXp(loadProfile(subject.subjectId), 50)
    addToast(`🏆 Hoàn thành bài thi! +50 EXP`)
    if (levelUp) addToast(`⭐ Lên cấp ${newProfile.level}!`)

    const isMock = exam.examId.startsWith('mock-')
    const { profile: levelAchProfile, unlockedIds: levelUnlockedIds } = checkLevelAchievements(newProfile)
    const { profile: achProfile, unlockedIds: examUnlockedIds } = checkExamAchievements(score.correct, items.length, isMock, levelAchProfile)
    checkAndShowAchievements([...levelUnlockedIds, ...examUnlockedIds], achProfile)
    setProfile(achProfile)
  }

  submitExamRef.current = submitExam

  async function exportGeminiPack() {
    if (!subject) return
    const selectedExams = exams.filter((item) => selectedGeminiExamIds.includes(item.examId))
    const pack = await fullGeminiPack(subject, questions, loadAttempts(subject.subjectId), exams, selectedExams, notebookDocuments)
    downloadFile(pack.blob, pack.filename)
    setGeminiExportStatus(`Đã tải Gemini Pack${selectedExams.length ? ` kèm ${selectedExams.length} đề` : ''}.`)
  }

  function refreshLearningProgress() {
    if (!subject) return
    const context = createExportContext(subject.subjectId)
    const markdown = learningProgressMarkdown(subject, questions, loadAttempts(subject.subjectId), context)
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
    const notebookUrl = savedNotebookUrl
    if (!notebookUrl) {
      setShowNotebookFallback(false)
      setAiTutorStatus('Đã sao chép prompt. Bạn chưa lưu link Gemini Notebook riêng, hãy mở Gemini và dán prompt.')
      return
    }
    const opened = window.open(notebookUrl, '_blank', 'noopener,noreferrer')
    setShowNotebookFallback(!opened)
    setAiTutorStatus(opened ? 'Đã sao chép prompt và mở Gemini Notebook.' : 'Đã sao chép prompt. Trình duyệt chặn cửa sổ mới, hãy bấm Mở Gemini Notebook.')
  }

  function openNotebook() {
    const notebookUrl = savedNotebookUrl
    if (notebookUrl) window.open(notebookUrl, '_blank', 'noopener,noreferrer')
  }

  function savePersonalNotebookUrl() {
    if (!subject) return
    const result = saveTutorNotebookUrl(subject.subjectId, personalNotebookUrl)
    if (!result.ok) {
      setNotebookSettingsStatus(result.message)
      return
    }
    setPersonalNotebookUrl(result.url)
    setSavedNotebookUrl(result.url)
    setNotebookSettingsStatus('Đã lưu link Gemini Notebook riêng trên trình duyệt này.')
  }

  function removePersonalNotebookUrl() {
    if (!subject) return
    clearTutorNotebookUrl(subject.subjectId)
    setPersonalNotebookUrl('')
    setSavedNotebookUrl('')
    setNotebookSettingsStatus('Đã xóa link Gemini Notebook khỏi trình duyệt này.')
  }

  const renderScreen = () => {
    if (screen === 'profile') {
      if (!profile) return null
      return (
        <main className="app-shell">
          <section className="subject-card result-card">
            <p className="eyebrow">Hồ sơ cá nhân</p>
            <h1>⭐ Cấp độ {profile.level} - {getLevelTitle(profile.level)}</h1>
            <p>Kinh nghiệm: {profile.xp} / {xpForNextLevel(profile.level)} XP</p>
            <h2 style={{marginTop: '2rem'}}>Danh hiệu của bạn</h2>
            <div className="achievements-grid">
              {ACHIEVEMENTS.map(ach => {
                const unlocked = profile.achievements.includes(ach.id)
                return (
                  <div key={ach.id} className={`achievement-item ${unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="ach-icon">{ach.icon}</div>
                    <div>
                      <strong>{ach.name}</strong>
                      <small>{ach.description}</small>
                    </div>
                  </div>
                )
              })}
            </div>
            <button className="text-button" type="button" onClick={() => setScreen('mode')}>Đóng</button>
          </section>
        </main>
      )
    }

    if (screen === 'loading') return <main className="center-message">Đang tải StudyPack…</main>
  if (screen === 'error') return <main className="center-message error-message">{error}</main>

  if (screen === 'subject-picker') return <main className="app-shell"><section className="subject-card" aria-labelledby="subject-picker-title"><p className="eyebrow">StudyPack Exam Prep</p><h1 id="subject-picker-title">Chọn môn để ôn</h1><div className="mode-list">{subjectCatalog.map((item) => <button key={item.subjectId} type="button" disabled={item.status !== 'published'} onClick={() => void chooseSubject(item)}><strong>{item.code} · {item.name}</strong><span>{item.status === 'published' ? item.description : 'Đang chuẩn bị ngân hàng câu hỏi và đề thi.'}</span></button>)}</div><p className="hint">Chỉ môn đã có dữ liệu được mở để luyện tập.</p></section></main>

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
          {resumeCandidate && <section className="resume-card" role="dialog" aria-labelledby="resume-title" aria-describedby="resume-description">
            <p className="eyebrow">Practice Session</p>
            <h2 id="resume-title">Bạn có một lượt luyện đang làm dở</h2>
            <p id="resume-description">Lượt {({ smart: 'luyện thông minh', random: 'ngẫu nhiên', unseen: 'câu chưa ôn', review: 'ôn lại' })[resumeCandidate.mode]} đang ở câu {resumeCandidate.position + 1}/{resumeCandidate.questionRefs.length}. Bạn muốn tiếp tục không?</p>
            <div className="resume-actions"><button className="primary-button" type="button" onClick={resumePractice}>Tiếp tục lượt đang làm</button><button className="secondary-button" type="button" onClick={startNewPractice}>Bắt đầu lượt mới</button></div>
          </section>}
          <button className="primary-button" type="button" onClick={() => setScreen('mode')}>Chọn cách luyện</button>
          {readingDocuments.length > 0 && <button className="secondary-button" type="button" onClick={() => setScreen('reading')}>Đọc tiếng Nhật + phiên âm</button>}
          {vocabulary && <button className="secondary-button" type="button" onClick={() => setScreen('vocabulary')}>Từ vựng / Từ Hán</button>}
          <button className="text-button" type="button" onClick={() => setScreen('statistics')}>Xem thống kê học tập</button>
          <button className="text-button" type="button" onClick={() => setScreen('subject-picker')}>Đổi môn học</button>
          <p className="hint">Chọn đáp án, bấm Xác nhận để xem kết quả, rồi bấm Tiếp tục sang câu kế tiếp.</p>
        </section>
      </main>
    )
  }

  function awardVocabularyXp(amount: 1 | 2) {
    if (!subject) return
    const { profile: xpProfile, levelUp } = addXp(loadProfile(subject.subjectId), amount)
    const { profile: achievementProfile, unlockedIds } = checkLevelAchievements(xpProfile)
    if (levelUp) addToast(`⭐ Lên cấp ${achievementProfile.level}!`)
    addToast(amount === 2 ? '✅ Bạn nhớ đúng! +2 XP' : '📚 Đã ghi nhận để ôn lại. +1 XP')
    checkAndShowAchievements(unlockedIds, achievementProfile)
  }

  function awardVocabularyPracticeXp(amount: 1 | 3, correct: boolean) {
    if (!subject) return
    const { profile: xpProfile, levelUp } = addXp(loadProfile(subject.subjectId), amount)
    const { profile: achievementProfile, unlockedIds } = checkLevelAchievements(xpProfile)
    if (levelUp) addToast(`⭐ Lên cấp ${achievementProfile.level}!`)
    addToast(correct ? '✅ Đúng! +3 XP' : '📚 Sai, hãy ôn lại. +1 XP')
    checkAndShowAchievements(unlockedIds, achievementProfile)
  }

  if (screen === 'reading' && subject) return <ReadingLibrary documents={readingDocuments} onBack={() => setScreen('subject')} />

  if (screen === 'vocabulary' && subject && vocabulary) return <VocabularyStudy vocabulary={vocabulary} onBack={() => setScreen('subject')} onStartQuizcard={() => setScreen('quizcard')} onStartPractice={() => setScreen('vocabulary-practice')} />

  if (screen === 'quizcard' && subject && vocabulary) return <AdaptiveQuizcardStudy subjectId={subject.subjectId} vocabulary={vocabulary} onBack={() => setScreen('vocabulary')} onAwardXp={awardVocabularyXp} />

  if (screen === 'vocabulary-practice' && subject && vocabulary) return <VocabularyPractice subjectId={subject.subjectId} vocabulary={vocabulary} onBack={() => setScreen('vocabulary')} onAwardXp={awardVocabularyPracticeXp} />

  if (screen === 'mode') return <main className="app-shell"><section className="subject-card" aria-labelledby="mode-title">
    <p className="eyebrow">{subject?.code} · Practice</p><h1 id="mode-title">Bạn muốn luyện thế nào?</h1>
    <div className="mode-list"><button type="button" onClick={() => startPractice('smart')}><strong>Luyện thông minh</strong><span>Ưu tiên câu cần ôn theo tiến độ của bạn.</span></button><button type="button" onClick={() => startPractice('random')}><strong>Ngẫu nhiên toàn bộ</strong><span>Chọn đều từ toàn bộ ngân hàng câu hỏi.</span></button><button type="button" onClick={() => startPractice('unseen')}><strong>Chỉ câu chưa ôn</strong><span>Chỉ lấy câu bạn chưa từng trả lời.</span></button><button type="button" onClick={() => startPractice('review')}><strong>Câu cần ôn lại</strong><span>Đã làm ít nhất 1 lần và hiện đúng từ 50% trở xuống.</span></button><button type="button" onClick={() => setScreen('exam-list')}><strong>Luyện theo đề thi</strong><span>Giữ thứ tự đề, đổi đáp án trước khi nộp.</span></button><button type="button" onClick={() => setScreen('mock-exam-setup')}><strong>Thi thử bấm giờ</strong><span>Tự chọn số câu và thời gian, hết giờ tự nộp bài.</span></button></div>
    <button className="text-button" type="button" onClick={() => setScreen('subject')}>Quay lại chọn môn</button>
  </section></main>

  if (screen === 'practice-empty') return <main className="app-shell"><section className="subject-card result-card"><p className="eyebrow">Chưa có câu phù hợp</p><h1>{practiceMode === 'unseen' ? 'Bạn đã ôn hết các câu hiện có' : 'Chưa có câu nào cần ôn lại'}</h1><p>{practiceMode === 'unseen' ? 'Hãy chọn một cách luyện khác hoặc xóa thống kê nếu bạn muốn bắt đầu lại từ đầu.' : 'Hãy làm thêm câu hỏi hoặc xem Statistics để kiểm tra tiến độ hiện tại.'}</p><button className="primary-button" type="button" onClick={() => setScreen('mode')}>Chọn cách luyện khác</button><button className="text-button" type="button" onClick={() => setScreen('statistics')}>Xem thống kê học tập</button></section></main>

  if (screen === 'exam-list') return <main className="app-shell"><section className="subject-card"><p className="eyebrow">{subject?.code} · Exam</p><h1>Chọn đề thi</h1><div className="mode-list">{exams.map((item) => <button key={item.examId} type="button" onClick={() => openExam(item)}><strong>{item.title}</strong><span>{item.declaredQuestionCount} câu · FE SP26</span></button>)}</div><button className="text-button" type="button" onClick={() => setScreen('mode')}>Quay lại</button></section></main>

  if (screen === 'mock-exam-setup') {
    const availableQuestionCount = new Set(questions.filter((item) => item.active).map((item) => item.id)).size
    const effectiveQuestionCount = Math.min(mockQuestionCount, availableQuestionCount)
    return <main className="app-shell"><section className="subject-card" aria-labelledby="mock-exam-title"><p className="eyebrow">{subject?.code} · Mock Exam</p><h1 id="mock-exam-title">Thi thử bấm giờ</h1><p>Tự bốc ngẫu nhiên Question active, không lặp câu. Hết giờ app tự nộp và lưu kết quả.</p><div className="notebook-settings"><h2>Số câu</h2><div className="mode-list">{[30, 35, 40, 45, 50].map((count) => <button className={mockQuestionCount === count ? 'selected' : ''} key={count} type="button" onClick={() => setMockQuestionCount(count)}>{count} câu</button>)}</div><label htmlFor="mock-question-count">Hoặc nhập từ 30 đến 50</label><input id="mock-question-count" type="number" min={MOCK_EXAM_MIN_QUESTION_COUNT} max={MOCK_EXAM_MAX_QUESTION_COUNT} value={mockQuestionCount} onChange={(event) => setMockQuestionCount(Math.min(MOCK_EXAM_MAX_QUESTION_COUNT, Math.max(MOCK_EXAM_MIN_QUESTION_COUNT, Number(event.target.value) || MOCK_EXAM_MIN_QUESTION_COUNT)))} /><p className="hint">Ngân hàng hiện có {availableQuestionCount} câu; bài thi sẽ dùng {effectiveQuestionCount} câu.</p><h2>Thời gian</h2><div className="mode-list">{[15, 30, 45, 60].map((minutes) => <button className={mockDurationMinutes === minutes ? 'selected' : ''} key={minutes} type="button" onClick={() => setMockDurationMinutes(minutes)}>{minutes} phút</button>)}</div><label htmlFor="mock-duration-minutes">Hoặc nhập số phút</label><input id="mock-duration-minutes" type="number" min="1" value={mockDurationMinutes} onChange={(event) => setMockDurationMinutes(Math.max(1, Number(event.target.value) || 1))} /></div><button className="primary-button" type="button" disabled={effectiveQuestionCount === 0} onClick={startMockExam}>Bắt đầu thi thử · {effectiveQuestionCount} câu · {mockDurationMinutes} phút</button><button className="text-button" type="button" onClick={() => setScreen('mode')}>Quay lại</button></section></main>
  }

  if (screen === 'exam' && exam) {
    const examItemsInOrder = resolveExamItems(exam, questions)
    const answeredCount = examItemsInOrder.filter(({ item }) => examAnswers[item.examItemId]?.length).length
    const toggleExamAnswer = (itemId: string, question: Question, optionId: string) => setExamAnswers((current) => {
      const selected = current[itemId] ?? []
      const next = question.maxSelections === 1 ? [optionId] : selected.includes(optionId) ? selected.filter((id) => id !== optionId) : selected.length < question.maxSelections ? [...selected, optionId] : selected
      return { ...current, [itemId]: next }
    })
    return <main className="practice-shell"><header className="practice-header"><span>{exam.title}</span><span>{mockExamEndsAt ? `Còn ${formatRemainingTime(remainingSeconds)}` : `${answeredCount}/${examItemsInOrder.length} đã trả lời`}</span></header>{mockExamEndsAt && <p className="hint">{answeredCount}/{examItemsInOrder.length} đã trả lời · Hết giờ sẽ tự nộp bài.</p>}{examItemsInOrder.map(({ item, question }, index) => <section className="question-card exam-question" key={item.examItemId}><p className="eyebrow">Câu {index + 1}{question.maxSelections > 1 ? ` · Chọn tối đa ${question.maxSelections} đáp án` : ''}</p><h2 className="question-text">{textOf(question.blocks)}</h2><div className="answers">{question.options.map((option, optionIndex) => <button className={`answer-button${(examAnswers[item.examItemId] ?? []).includes(option.id) ? ' selected' : ''}`} key={option.id} type="button" onClick={() => toggleExamAnswer(item.examItemId, question, option.id)}><span className="option-label">{String.fromCharCode(65 + optionIndex)}</span><span className="answer-content">{textOf(option.blocks)}</span></button>)}</div></section>)}<button className="primary-button" type="button" onClick={() => submitExam()}>Nộp bài</button></main>
  }

  if (screen === 'exam-result' && exam) {
    const items = resolveExamItems(exam, questions); const score = examScore(examAnswers, items)
    return <main className="app-shell"><section className="subject-card result-card"><p className="eyebrow">Kết quả đề thi</p><h1>{score.correct}/{items.length} câu đúng</h1><p>Tỉ lệ đúng: {score.percent}% · Chưa trả lời: {score.unanswered}</p>{wasAutoSubmitted && <p className="error-message">Đã hết giờ, bài thi được tự động nộp.</p>}<section className="exam-review" aria-label="Xem lại đáp án và lời giải"><h2>Xem lại từng câu</h2>{items.map(({ item, question }, index) => { const selectedIds = examAnswers[item.examItemId] ?? []; const selectedOptions = question.options.filter((option) => selectedIds.includes(option.id)); const correctOptions = question.options.filter((option) => question.correctAnswerIds.includes(option.id)); const state = selectedIds.length === 0 ? 'unanswered' : gradeAnswer(question, selectedIds) ? 'correct' : 'incorrect'; const label = state === 'correct' ? 'Đúng' : state === 'incorrect' ? 'Sai' : 'Chưa trả lời'; return <article className={`review-item review-${state}`} key={item.examItemId}><p className="eyebrow">Câu {index + 1} · {label}</p><h3>{textOf(question.blocks)}</h3><p><strong>Bạn chọn:</strong> {selectedOptions.length ? selectedOptions.map((option) => textOf(option.blocks)).join('; ') : 'Chưa trả lời'}</p><p><strong>Đáp án đúng:</strong> {correctOptions.map((option) => textOf(option.blocks)).join('; ') || 'Chưa có dữ liệu'}</p>{question.explanation && <div className="review-explanation"><strong>Lời giải</strong><p>{textOf(question.explanation.blocks)}</p></div>}<button className="secondary-button" type="button" onClick={() => void askAi(question, { title: exam.title, questionNumber: index + 1 })}>Hỏi AI để hiểu kỹ câu này</button></article> })}</section>{aiTutorStatus && <p className="ai-tutor-status" aria-live="polite">{aiTutorStatus}</p>}{showNotebookFallback && <button className="text-button" type="button" onClick={openNotebook}>Mở Gemini Notebook</button>}<button className="primary-button" type="button" onClick={() => { setExam(null); setScreen('exam-list') }}>Chọn đề khác</button><button className="text-button" type="button" onClick={() => setScreen('statistics')}>Xem thống kê học tập</button><button className="text-button" type="button" onClick={() => setScreen('subject')}>Quay lại chọn môn</button></section></main>
  }

  if (screen === 'complete') {
    return (
      <main className="app-shell">
        <section className="subject-card result-card" aria-labelledby="result-title">
          <p className="eyebrow">Hoàn thành lượt luyện</p>
          <h1 id="result-title">{correctCount}/{position + (isLocked ? 1 : 0)} câu đúng</h1>
          <p>Kết quả từng câu đã được lưu trong trình duyệt của bạn và đã phản ánh vào Statistics.</p>
          <button className="primary-button" type="button" onClick={() => startPractice(practiceMode)}>Luyện vòng mới</button>
          <button className="text-button" type="button" onClick={() => setScreen('subject')}>Quay lại chọn môn</button>
          <button className="text-button" type="button" onClick={() => setScreen('statistics')}>Xem thống kê</button>
        </section>
      </main>
    )
  }

  if (screen === 'statistics') {
    const summary = summarizeQuestions(questions, loadAttempts(subject?.subjectId ?? ''))
    const labels = { not_practiced: 'Chưa ôn', learning: 'Đang học', weak: 'Yếu', developing: 'Đang phát triển', stable: 'Ổn', mastered: 'Thành thạo' }
    const rules = { not_practiced: '0 lần trả lời', learning: '1–3 lần trả lời', weak: 'Từ 4 lần, đúng ≤ 50%', developing: 'Từ 4 lần, đúng > 50% đến 75%', stable: 'Từ 4 lần, đúng > 75% đến < 90%', mastered: 'Từ 4 lần, đúng ≥ 90%' }
    const colors = { not_practiced: 'var(--bg-muted)', learning: '#38bdf8', weak: 'var(--danger-border)', developing: '#fbbf24', stable: 'var(--success-border)', mastered: 'var(--success)' }
    const totalCount = questions.length
    let accumulatedPercent = 0
    const gradientStops: string[] = []
    const order = ['not_practiced', 'learning', 'weak', 'developing', 'stable', 'mastered'] as const
    order.forEach((key) => {
      const count = summary.counts[key]
      if (count > 0) {
        const percent = (count / totalCount) * 100
        gradientStops.push(`${colors[key]} ${accumulatedPercent}% ${accumulatedPercent + percent}%`)
        accumulatedPercent += percent
      }
    })
    const conicGradient = gradientStops.length > 0 ? `conic-gradient(${gradientStops.join(', ')})` : 'conic-gradient(var(--bg-muted) 0% 100%)'
    const detailedQuestions = detailStatus ? questionsByStatus(questions, loadAttempts(subject?.subjectId ?? ''), detailStatus) : []
    const resetStatistics = () => {
      if (window.confirm(`Xóa toàn bộ lịch sử trả lời ${subject?.code} trên trình duyệt này? Bạn sẽ bắt đầu lại từ đầu.`)) {
        clearAttempts(subject?.subjectId ?? '')
        setDetailStatus(null)
        setStatisticsRevision((value) => value + 1)
      }
    }
    const loadDemo = () => {
      seedStatisticsDemo(subject?.subjectId ?? '', questions.slice(0, 6).map((question) => question.id))
      setDetailStatus(null)
      setStatisticsRevision((value) => value + 1)
    }
    return <main className="app-shell"><section className="subject-card" aria-labelledby="statistics-title">
      <p className="eyebrow">{subject?.code} · Statistics</p><h1 id="statistics-title">Tiến độ học tập</h1>
      <dl className="subject-facts"><div><dt>Lượt trả lời</dt><dd>{summary.totalAttempts}</dd></div><div><dt>Tỉ lệ đúng chung</dt><dd>{summary.accuracy}%</dd></div></dl>
      <div className="donut-chart-container"><div className="donut-chart" style={{ background: conicGradient }}><div className="donut-hole"><span className="donut-total">{totalCount}</span><span className="donut-label">câu hỏi</span></div></div></div>
      <div className="statistics-list">{order.map((status) => { const count = summary.counts[status]; const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0; return <div className="statistics-card" key={status}><div className="statistics-card-header"><div className="statistics-dot" style={{ background: colors[status] }}></div><strong>{labels[status]}</strong><span className="statistics-percent">{percent}%</span></div><small>{rules[status]}</small><button type="button" className="text-button" onClick={() => setDetailStatus(status)}>Xem chi tiết · {count} câu</button></div> })}</div>
      {detailStatus && <section className="detail-list" aria-live="polite"><h2>{labels[detailStatus]} · {detailedQuestions.length} câu</h2>{detailedQuestions.map((question) => { const ownAttempts = loadAttempts(subject?.subjectId ?? '').filter((attempt) => attempt.questionId === question.id); const correct = ownAttempts.filter((attempt) => attempt.isCorrect).length; return <article key={question.id}><strong>{question.id}</strong><p>{textOf(question.blocks)}</p><small>{ownAttempts.length} lần làm · {correct} đúng · {ownAttempts.length ? Math.round((correct / ownAttempts.length) * 100) : 0}%</small></article> })}</section>}
      <section className="gemini-documents" aria-labelledby="gemini-documents-title"><p className="eyebrow">Gemini Learning Documents</p><h2 id="gemini-documents-title">Xuất tài liệu để đưa vào Gemini</h2><p>Gói chỉ là snapshot đọc-only. Kết quả trong Gemini không tự thay đổi Statistics của app; bạn có thể tự thêm theory Markdown vào Notebook.</p><div className="notebook-settings"><h3>Gemini Notebook của bạn</h3><p>Link này chỉ lưu trên trình duyệt hiện tại và chỉ dùng khi bạn bấm Hỏi AI.</p><label htmlFor="personal-notebook-url">Đường link Gemini Notebook</label><input id="personal-notebook-url" type="url" inputMode="url" placeholder="https://notebooklm.google.com/..." value={personalNotebookUrl} onChange={(event) => setPersonalNotebookUrl(event.target.value)} /><div><button className="secondary-button" type="button" onClick={savePersonalNotebookUrl}>Lưu link riêng</button><button className="text-button inline-button" type="button" onClick={removePersonalNotebookUrl}>Xóa link</button></div>{notebookSettingsStatus && <p className="notebook-status" aria-live="polite">{notebookSettingsStatus}</p>}</div><fieldset><legend>Đính kèm đề thi (tùy chọn)</legend>{exams.map((item) => <label key={item.examId}><input type="checkbox" checked={selectedGeminiExamIds.includes(item.examId)} onChange={() => setSelectedGeminiExamIds((current) => current.includes(item.examId) ? current.filter((id) => id !== item.examId) : [...current, item.examId])} /> {item.title} · {item.items.length} câu</label>)}</fieldset><button className="primary-button" type="button" onClick={() => void exportGeminiPack()}>Tải Full Gemini Pack (.zip)</button><button className="text-button" type="button" onClick={refreshLearningProgress}>Tải learning-progress.md mới nhất</button>{geminiExportStatus && <p className="export-status" aria-live="polite">{geminiExportStatus}</p>}</section>
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
        <span>
          Đã làm: {position} 
          <button className="text-button inline-button" style={{marginLeft: '1rem', padding: '0.25rem 0.5rem', fontSize: '0.85rem'}} type="button" onClick={() => { if (subject) clearPracticeSession(subject.subjectId); setScreen('complete') }}>Kết thúc & Xem điểm</button>
        </span>
      </header>
      <section className="question-card" aria-labelledby="question-title">
        <p className="eyebrow">{question.id}{question.maxSelections > 1 ? ` · Chọn tối đa ${question.maxSelections} đáp án` : ''}</p>
        <h1 id="question-title" className="question-text">{textOf(question.blocks)}</h1>
        <div className="answers" aria-label="Các đáp án">
          {(() => {
            const currentRef = activePracticeSession?.questionRefs[position]
            const orderedOptions = currentRef?.optionOrder
              ? currentRef.optionOrder.map(id => question.options.find(o => o.id === id)!).filter(Boolean)
              : question.options

            return orderedOptions.map((option, index) => {
              const isSelected = selectedOptionIds.includes(option.id)
              const isAnswer = question.correctAnswerIds.includes(option.id)
              const state = isLocked
                ? (isAnswer ? ' correct' : isSelected ? ' incorrect' : '')
                : isSelected ? ' selected' : ''
              return (
              <button aria-pressed={isSelected} className={`answer-button${state}`} disabled={isLocked} key={option.id} type="button" onClick={() => chooseAnswer(option.id)}>
                <span className="option-label">{String.fromCharCode(65 + index)}</span>
                <span className="answer-content">{textOf(option.blocks)}</span>
              </button>
            )
            })
          })()}
        </div>
        {!isLocked && <button className="primary-button" type="button" disabled={selectedOptionIds.length === 0} onClick={() => submitPracticeAnswer(selectedOptionIds)}>{question.maxSelections === 1 ? 'Xác nhận đáp án' : `Xác nhận ${selectedOptionIds.length}/${question.maxSelections} đáp án`}</button>}
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

  const isGamifiedScreen = profile !== null && screen !== 'loading' && screen !== 'error' && screen !== 'exam' && screen !== 'practice'

  return (
    <>
      {isGamifiedScreen && (
        <header className="global-gamification-header">
          <button type="button" className="theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} title="Đổi giao diện Sáng/Tối" style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', marginRight: '1rem' }}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <div className="gamification-badge" onClick={() => setScreen('profile')}>
            <span className="gamification-level">⭐ Lvl {profile.level}</span>
            <span className="gamification-xp">{profile.xp} XP</span>
          </div>
        </header>
      )}
      {renderScreen()}
      <div className="toast-container">
        {toastMessages.map(t => <div key={t.id} className="toast">{t.message}</div>)}
      </div>
    </>
  )
}

export default App
