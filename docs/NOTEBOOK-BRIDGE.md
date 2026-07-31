# Gemini Notebook Bridge

Status: Accepted

Ứng dụng không gọi AI API. JSON và lịch sử làm bài trong app là nguồn dữ liệu
gốc; Gemini chỉ đọc snapshot Markdown do app export.

- App tạo prompt từ Question hiện tại, sao chép vào clipboard và mở URL Gemini
  Notebook riêng người học đã lưu local cho môn đó nếu có.
- Gemini không được cập nhật ngược kết quả, tỷ lệ đúng hoặc trạng thái học.
- Người học tự thêm tài liệu lý thuyết vào Notebook khi cần; app không export
  nội dung `theory/`.

Quy tắc đầy đủ về gói export, Question Bank, Learning Progress, Exam, assets,
validation và vị trí giao diện nằm trong `GEMINI-EXPORT-CONTRACT.md`.
Quy tắc riêng của nút **Hỏi AI** nằm trong `AI-TUTOR-CONTRACT.md`.
