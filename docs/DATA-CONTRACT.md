# Data Contract

Status: Partially accepted

Tài liệu này sẽ tổng hợp các hợp đồng dữ liệu sau khi từng phần được chốt.

## Đã chốt

- Question Contract
- Exam Contract
- Duplicate Detection and Merge
- Explanation và luồng hiển thị
- Gemini Export Contract
- AI Tutor Contract
- Progress Contract
- Validation Contract
- Subject Contract
- Topic Contract
- Exam Import Contract
- Practice Session Contract: V1 Practice resume slice accepted; full session
  model remains partially accepted

## Quy tắc đồng bộ với implementation

- `AttemptRecord` là lịch sử kết quả học tập hiện đang được Statistics sử dụng.
- `PracticeSession` là snapshot tạm thời dùng để khôi phục Practice đang làm dở.
- Hai loại dữ liệu không được dùng thay thế cho nhau.
- Practice Session V1 chỉ lưu trong browser `localStorage`, theo từng
  `subjectId`; không có backend persistence.
- Tài liệu không được mô tả Exam resume hoặc Question version history là chức
  năng đã triển khai nếu code chưa hỗ trợ.
