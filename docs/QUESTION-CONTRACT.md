# Question Contract

Status: Accepted

## Các quyết định đã chốt

- Mỗi câu hỏi có một ID cố định, duy nhất trong phạm vi môn.
- Định dạng ID đề xuất: `{subjectId}-q-{sequence}`, ví dụ `jpd123-q-0001`.
- ID không phụ thuộc đề thi hoặc vị trí hiển thị.
- Một câu xuất hiện trong nhiều đề vẫn dùng chung một question ID.
- Nội dung được lưu bằng `blocks` để hỗ trợ Markdown, hình ảnh, bảng và code.
- Mỗi lựa chọn có ID ổn định; đáp án đúng tham chiếu ID lựa chọn, không tham chiếu vị trí A/B/C/D.
- `correctAnswerIds` là mảng.
- `maxSelections` quy định số lựa chọn tối đa mà người học được chọn.
- Không có `difficulty`.
- Câu hỏi không bắt buộc có chủ đề. `topicIds` thiếu, `null` hoặc mảng rỗng đều
  được chuẩn hóa thành `[]`; câu vẫn được phát hành và chỉ nhận
  `QUESTION_HAS_NO_TOPIC` ở mức `info`.
- Chỉ giữ mã đề hoặc tên khu vực có sẵn trong dữ liệu nguồn; app không tự suy
  luận Topic. Đề thi là `Exam`, không phải Topic.
- Câu từ đề thi cũ vẫn nằm trong ngân hàng câu hỏi chung.
- Random All lấy tất cả câu active và loại trùng theo question ID.
- Prompt Hỏi AI phải gửi cả question ID lẫn nội dung câu hỏi.
- `explanation` không bắt buộc và dùng cấu trúc `blocks`.
- Lời giải thuộc Question, không thuộc ExamItem.
- `correctAnswerIds` là đáp án đang được app dùng để chấm, không phải cam kết
  rằng đáp án đó đúng tuyệt đối về mặt kiến thức. Chủ ngân hàng có thể yêu cầu
  xem xét lại dựa trên nguồn học thuật hoặc tài liệu kỹ thuật đáng tin cậy.
- Khi thay đổi đáp án của câu đã phát hành, phải ghi nhận lý do và không được
  làm mất lịch sử kết quả cũ một cách âm thầm.

## Cấu trúc tham chiếu

```json
{
  "id": "jpd123-q-0001",
  "blocks": [
    {
      "type": "markdown",
      "text": "Nội dung câu hỏi..."
    }
  ],
  "options": [
    {
      "id": "opt-1",
      "blocks": [
        {
          "type": "markdown",
          "text": "Lựa chọn thứ nhất"
        }
      ]
    }
  ],
  "correctAnswerIds": ["opt-1"],
  "maxSelections": 1,
  "explanation": {
    "blocks": [
      {
        "type": "markdown",
        "text": "Đáp án đúng vì..."
      }
    ]
  },
  "active": true
}
```

## Quy tắc chấm

- Một câu chỉ đúng khi tập ID người học xác nhận bằng chính `correctAnswerIds`.
- Chọn thiếu, chọn thừa hoặc chọn sai đều là sai.
- Không có điểm riêng theo độ khó hoặc khu vực.
- Thi thử: chỉ chấm khi nộp toàn bộ bài; câu bỏ trống tính 0 câu đúng.
- Luyện tập: câu một đáp án được ghi nhận và khóa ngay. Câu nhiều đáp án cho
  phép chọn tối đa `maxSelections`, sau đó người học bấm xác nhận một lần để
  khóa toàn bộ tập lựa chọn.
- Sau khi xác nhận, hiển thị đáp án đúng và lời giải nếu có.
- Người học phải bấm **Tiếp tục**; app không tự chuyển.
- Câu sai được đưa vào danh sách câu yếu và có thể xuất hiện lại ở lượt luyện khác; lịch sử sai cũ không bị xóa.

## Còn mở

1. Validation — quy tắc kiểm tra dữ liệu lỗi.
