import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="welcome-card" aria-labelledby="study-pack-title">
        <p className="eyebrow">StudyPack Exam Prep</p>
        <h1 id="study-pack-title">Ôn trắc nghiệm, biết rõ mình cần ôn gì tiếp theo.</h1>
        <p className="summary">
          Nền tảng ứng dụng đang được thiết lập. Các vòng phát triển tiếp theo sẽ đưa ngân hàng câu hỏi JPD,
          chế độ Practice/Exam và thống kê học tập vào đây.
        </p>
        <div className="status" role="status">
          <span className="status-dot" aria-hidden="true" />
          Sẵn sàng cho đợt triển khai đầu tiên
        </div>
      </section>
    </main>
  )
}

export default App
