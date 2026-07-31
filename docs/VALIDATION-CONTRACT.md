# Validation Contract

Status: Accepted

Tài liệu này quy định cách kiểm tra dữ liệu câu hỏi, đề thi và tài nguyên trước
khi chúng được sử dụng hoặc xuất Markdown. Validator chỉ báo lỗi và bảo vệ dữ
liệu; không tự sửa nội dung học liệu hoặc tự gộp câu.

## 1. Mức độ vấn đề

| Mức | Ý nghĩa | Cách xử lý |
|---|---|---|
| `error` | Dữ liệu không thể được sử dụng chính xác | Chặn nhập, xuất bản hoặc xuất Markdown |
| `warning` | Dữ liệu vẫn dùng được nhưng cần người dùng chú ý | Cho tiếp tục sau cảnh báo |
| `info` | Gợi ý cải thiện chất lượng | Không chặn |

Mỗi vấn đề phải có tối thiểu:

```json
{
  "severity": "error",
  "code": "CORRECT_ANSWER_NOT_FOUND",
  "questionId": "jpd123-q-0042",
  "field": "correctAnswerIds[0]",
  "message": "Đáp án đúng answer-5 không tồn tại trong choices."
}
```

`field` phải chỉ ra vị trí dữ liệu cần sửa khi có thể xác định được.

## 2. Lỗi chặn Question

Một Question không được đưa vào ngân hàng active nếu có bất kỳ lỗi nào sau:

- Thiếu `questionId`.
- `questionId` sai định dạng hoặc trùng với Question khác.
- Thiếu nội dung câu hỏi.
- Không có lựa chọn trả lời.
- Hai `answerId` trong cùng câu bị trùng.
- `correctAnswerIds` chứa ID không tồn tại trong danh sách lựa chọn.
- Không có đáp án đúng.
- Câu một đáp án khai báo nhiều đáp án đúng.
- Block ảnh thiếu đường dẫn.
- Block code thiếu nội dung.
- Loại block không được hỗ trợ.
- `subjectId` không tồn tại.

Validator phải dùng mã lỗi ổn định để giao diện và kiểm thử có thể nhận biết,
không chỉ dựa vào nội dung `message`.

## 3. Cảnh báo và thông tin

Những trường hợp sau không tự động chặn Question:

- Chưa có lời giải: `warning`.
- Không ghi nguồn câu hỏi: `warning`.
- Ảnh không có mô tả thay thế: `warning`.
- Câu không thuộc đề thi nào: `warning`.
- Nội dung rất giống một câu đã tồn tại: `warning`.
- Một ExamItem tham chiếu đến Question đang bị vô hiệu hóa: `warning`.
- Số câu thực tế của đề khác số lượng được khai báo: `warning` khi đang nhập
  hoặc chỉnh sửa; đề vẫn không được xuất bản cho đến khi số lượng khớp.
- Lời giải quá ngắn: `info`.

Khi thiếu lời giải:

- Câu vẫn được dùng để luyện tập và thi thử.
- Giao diện và Markdown hiển thị **Chưa có lời giải**.
- Không tự dùng AI để tạo lời giải chính thức.

## 4. Phát hiện câu có thể trùng

Với câu nghi trùng, Validator chỉ cảnh báo và không tự gộp:

```text
Câu jpd123-q-0091 có thể trùng với jpd123-q-0042.
Độ tương đồng: 96%.
```

Người nhập chọn một trong ba cách:

1. **Dùng lại câu cũ:** các ExamItem liên quan trỏ đến `questionId` đã có.
2. **Giữ thành câu riêng:** hai Question tiếp tục có ID khác nhau.
3. **Kiểm tra sau:** Question mới giữ trạng thái `draft` và chưa được xuất bản.

Không được tự gộp vì khác biệt nhỏ về chữ, ảnh hoặc đáp án có thể làm thay đổi
ý nghĩa của câu hỏi. Việc gộp đã xác nhận vẫn phải tuân theo
`DUPLICATE-MERGE.md`.

## 5. Kiểm tra assets

Mỗi tài nguyên được tham chiếu phải thỏa mãn:

- Tệp tồn tại.
- Dùng đường dẫn tương đối trong Subject Pack.
- Không thoát khỏi thư mục môn học bằng `../`.
- Định dạng tệp nằm trong danh sách được hỗ trợ.
- Không có hai tệp chỉ khác nhau bởi chữ hoa và chữ thường.

Tài nguyên không còn được sử dụng chỉ tạo `warning`; validator không tự xóa.

## 6. Kiểm tra Exam

Một Exam chỉ được xuất bản khi:

- `examId` là duy nhất.
- `subjectId` tồn tại.
- Có ít nhất một ExamItem.
- Mỗi `examItemId` là duy nhất trong đề.
- Mỗi ExamItem tham chiếu đến `questionId` tồn tại và có thể sử dụng.
- Thứ tự câu hợp lệ, không trùng và không thiếu bất thường.
- Số ExamItem thực tế khớp số lượng được khai báo.

Cùng một `questionId` được phép xuất hiện nhiều vị trí nếu đề gốc thực sự có
như vậy. Validator có thể cảnh báo nhưng không được tự xóa hoặc làm giảm số
ExamItem.

## 7. Thời điểm chạy

Validation phải chạy:

1. Khi nhập hoặc chỉnh sửa một Question.
2. Khi nhập hoặc chỉnh sửa một Exam.
3. Trước khi xuất Markdown.
4. Trên toàn bộ ngân hàng trước khi phát hành phiên bản dữ liệu mới.

Khi xuất Markdown:

- Có ít nhất một `error`: chặn xuất và hiển thị danh sách lỗi.
- Chỉ có `warning`: cho xuất sau khi người dùng xác nhận.
- Chỉ có `info` hoặc không có vấn đề: xuất bình thường.

## 8. Bảo vệ phiên bản hợp lệ

Nếu việc chỉnh sửa một Question đã có lịch sử làm bài tạo ra `error`:

- Không ghi đè phiên bản hợp lệ hiện tại.
- Lưu thay đổi thành `draft`.
- Lịch sử tiếp tục tham chiếu phiên bản hợp lệ cũ.
- Chỉ thay thế phiên bản đang dùng khi bản mới không còn `error`.

Quy tắc này cũng áp dụng cho dữ liệu đã được ExamItem tham chiếu.

## 9. Báo cáo

Kết quả validation có dạng:

```json
{
  "valid": false,
  "summary": {
    "errors": 2,
    "warnings": 3,
    "info": 1
  },
  "issues": []
}
```

- `valid` chỉ bằng `true` khi không có `error`.
- Giao diện phải cho phép đi từ từng issue đến đúng Question, Exam và `field`
  cần sửa.
- Báo cáo không được tự sửa, tự xóa tài nguyên hoặc tự gộp Question.

## 10. Bất biến

- `error` luôn chặn sử dụng hoặc xuất bản dữ liệu liên quan.
- `warning` không tự chặn dữ liệu, trừ điều kiện xuất bản Exam được nêu riêng.
- Validator không tự tạo lời giải.
- Validator không tự gộp `POSSIBLE_DUPLICATE`; `EXACT_DUPLICATE` trong quy
  trình nhập đề được phép tự dùng lại Question hiện có.
- Validator không tự xóa tài nguyên không còn được sử dụng.
- Bản chỉnh sửa có lỗi không được thay thế bản hợp lệ đang được dùng.
- Validation không được làm thay đổi số ExamItem hoặc cấu trúc đề gốc.
