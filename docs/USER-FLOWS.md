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

Chế độ luyện tập không có bước **Xác nhận đáp án** riêng cho câu một đáp án.
Câu nhiều đáp án cho phép chọn tối đa `maxSelections`, sau đó xác nhận một lần
để chấm và khóa tập lựa chọn.

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
