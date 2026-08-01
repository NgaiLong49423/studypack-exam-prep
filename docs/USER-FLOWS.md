# User Flows

Status: Partially accepted

## Luyện tập

1. Hiển thị câu hỏi.
2. Người học chọn một hoặc nhiều đáp án; các đáp án đang chọn được đánh dấu rõ
   nhưng chưa hiển thị kết quả.
3. Người học có thể đổi lựa chọn tạm thời trong giới hạn của câu hỏi, rồi bấm
   **Xác nhận đáp án**.
4. App chỉ sau đó mới ghi nhận, chấm, lưu và khóa câu.
5. App hiển thị đúng/sai, đáp án đúng, lời giải nếu có và **Hỏi AI**.
6. App không tự chuyển câu.
7. Nếu bấm **Hỏi AI**, app sao chép prompt và mở Gemini Notebook riêng đã lưu
   trên trình duyệt; nếu chưa có link, app hướng dẫn người học tự mở Gemini.
8. Người học bấm **Tiếp tục** để chuyển sang câu kế tiếp.

Quy tắc **Xác nhận đáp án** chỉ áp dụng cho chế độ Luyện tập. Thi theo đề và
Thi thử vẫn cho phép sửa lựa chọn đến khi bấm **Nộp bài**.

## Thi thử

1. Người học làm toàn bộ đề và có thể sửa lựa chọn trước khi nộp.
2. App không hiển thị đáp án hoặc lời giải trong lúc làm.
3. Người học bấm **Nộp bài** một lần.
4. App chấm toàn bộ `ExamItem`; câu bỏ trống tính 0 câu đúng.
5. Màn hình xem lại hiển thị lựa chọn của người học, đáp án đúng, trạng thái đúng/sai/bỏ trống, lời giải nếu có và **Hỏi AI**.
6. Nếu bấm **Hỏi AI**, app sao chép prompt và mở Gemini Notebook riêng đã lưu
   trên trình duyệt; nếu chưa có link, app hướng dẫn người học tự mở Gemini.

### Thi thử bấm giờ

1. Người học chọn từ 30 đến 50 câu và thời gian bằng preset hoặc số phút tự nhập.
2. App bốc Question `active` ngẫu nhiên, không lặp `questionId`; nếu ngân hàng
   không đủ, dùng toàn bộ số câu duy nhất hiện có.
3. Đồng hồ đếm ngược luôn hiển thị trong khi làm bài.
4. Người học có thể nộp sớm; khi đồng hồ về `00:00`, app tự nộp đúng một lần.
5. Kết quả được chấm, lưu Statistics và xem lại như luồng thi thử thông thường.

Trong cả hai chế độ, **Hỏi AI** không được bật trước khi câu trả lời hoặc bài thi đã được ghi nhận.

## Xử lý câu trùng

1. Nhập đề và tạo đủ `ExamItem`.
2. App liệt kê ứng viên trùng trong cùng môn.
3. Người nhập so sánh hai câu.
4. Chọn **Gộp**, **Giữ riêng** hoặc **Bỏ qua**.
5. Nếu gộp, app chỉ đổi tham chiếu `questionId`; mọi vị trí trong đề được giữ nguyên.
