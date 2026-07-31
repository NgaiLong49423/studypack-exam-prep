# User Flows

Status: Partially accepted

## Luyện tập

1. Hiển thị câu hỏi.
2. Người học chọn một đáp án.
3. App ghi nhận lựa chọn đầu tiên, chấm, tự động lưu và khóa câu ngay.
4. Người học không thể đổi, bỏ chọn hoặc chọn lại đáp án trong cùng lượt.
5. App hiển thị đúng/sai, đáp án đúng, lời giải nếu có và **Hỏi AI**.
6. App không tự chuyển câu.
7. Nếu bấm **Hỏi AI**, app sao chép prompt và mở Gemini Notebook riêng đã lưu
   trên trình duyệt; nếu chưa có link, app hướng dẫn người học tự mở Gemini.
8. Người học bấm **Tiếp tục** để chuyển sang câu kế tiếp.

Chế độ luyện tập không có bước **Xác nhận đáp án** riêng. Lần chọn đầu tiên là
kết quả duy nhất được dùng để chấm và thống kê.

## Thi thử

1. Người học làm toàn bộ đề và có thể sửa lựa chọn trước khi nộp.
2. App không hiển thị đáp án hoặc lời giải trong lúc làm.
3. Người học bấm **Nộp bài** một lần.
4. App chấm toàn bộ `ExamItem`; câu bỏ trống tính 0 câu đúng.
5. Màn hình xem lại hiển thị lựa chọn của người học, đáp án đúng, trạng thái đúng/sai/bỏ trống, lời giải nếu có và **Hỏi AI**.
6. Nếu bấm **Hỏi AI**, app sao chép prompt và mở Gemini Notebook riêng đã lưu
   trên trình duyệt; nếu chưa có link, app hướng dẫn người học tự mở Gemini.

Trong cả hai chế độ, **Hỏi AI** không được bật trước khi câu trả lời hoặc bài thi đã được ghi nhận.

## Xử lý câu trùng

1. Nhập đề và tạo đủ `ExamItem`.
2. App liệt kê ứng viên trùng trong cùng môn.
3. Người nhập so sánh hai câu.
4. Chọn **Gộp**, **Giữ riêng** hoặc **Bỏ qua**.
5. Nếu gộp, app chỉ đổi tham chiếu `questionId`; mọi vị trí trong đề được giữ nguyên.
