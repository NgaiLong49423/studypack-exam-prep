# AI Tutor Contract

Status: Accepted

## Phạm vi

Ứng dụng không tích hợp hoặc gọi AI API. Nút **Hỏi AI** chỉ:

1. Tạo prompt từ câu hỏi sau khi kết quả đã được ghi nhận.
2. Sao chép prompt vào clipboard.
3. Mở Gemini Notebook riêng do người học cấu hình trên trình duyệt.

Nội dung Gemini trả lời không tự động được lưu hoặc ghi đè `explanation` chính thức.

## Điều kiện sử dụng

- Luyện tập: chỉ bật sau khi người học chọn đáp án và câu đã được chấm, lưu,
  khóa ngay.
- Thi thử: bị khóa trong lúc làm bài; chỉ bật sau khi người học bấm **Nộp bài**.
- Không được để người học dùng nút này để xem đáp án trước khi kết quả được ghi nhận.

## Dữ liệu tối thiểu trong prompt

```text
Môn học: JPD123
Mã câu hỏi: jpd123-q-0042
Đề nguồn: SP26 C2FE — Câu 17

[Câu hỏi]
...

[Các lựa chọn]
1. ...
2. ...
3. ...
4. ...

[Đáp án đúng]
3

[Lời giải hiện có]
Chưa có lời giải
```

Prompt phải chứa:

- Môn học.
- `questionId`.
- Đề, khu vực và vị trí nguồn nếu có.
- Toàn bộ nội dung câu hỏi và lựa chọn cần thiết để trả lời, gồm cả ảnh, bảng hoặc code liên quan.
- Đáp án đúng.
- Lời giải chính thức nếu có; nếu không có ghi `Chưa có lời giải`.

Không gửi:

- Lựa chọn của người học.
- Toàn bộ lịch sử làm bài hoặc tỷ lệ đúng.
- Các câu khác trong đề.
- Thông tin tài khoản.
- Toàn bộ thống kê học tập.

## Yêu cầu giải thích

Prompt không thay đổi theo việc người học trả lời đúng, sai hay bỏ trống.
Gemini phải giải thích kỹ câu hỏi để người học hiểu:

```text
1. Kiến thức hoặc kỹ năng đang được kiểm tra.
2. Cách suy luận từng bước để chọn đáp án đúng.
3. Vì sao các đáp án còn lại không phù hợp hoặc là bẫy.
4. Quy tắc hoặc khái niệm liên quan trực tiếp.
5. Một ví dụ ngắn nếu giúp làm rõ kiến thức.
6. Nếu chưa có lời giải chính thức, nói rõ đây là giải thích hỗ trợ học tập.
```

## Luồng thao tác

```text
Bấm Hỏi AI
→ tạo prompt
→ sao chép vào clipboard
→ mở Gemini Notebook của môn
→ người học dán prompt và gửi
```

Nếu trình duyệt chặn mở trang mới:

- Prompt vẫn phải được sao chép.
- Hiện thông báo **Đã sao chép prompt**.
- Hiện nút **Mở Gemini Notebook** để người học chủ động bấm.

Nếu người học chưa lưu link Notebook riêng:

- Vẫn cho phép sao chép prompt.
- Không tự mở trang.
- Thông báo rõ Notebook của môn chưa được cấu hình.

## Cấu hình link Notebook riêng của người học

Mỗi người học tự lưu một link Gemini Notebook theo từng môn trong
`localStorage` của trình duyệt hiện tại. Link này không nằm trong Question Bank,
Gemini Pack, GitHub hoặc dữ liệu dùng chung; không có account sync ở V1.

- Key được phân biệt theo `subjectId`.
- Chỉ chấp nhận URL `https` hợp lệ.
- App chỉ dùng link local đã lưu của người học.
- Người học có thể xóa link để trở lại trạng thái chưa cấu hình.

## Cấu hình dùng chung theo môn

```json
{
  "subjectId": "jpd123",
  "aiTutor": {
    "enabled": true,
    "provider": "gemini-notebook",
    "promptTemplateId": "explain-question-v1"
  }
}
```

- `subject.json` không chứa URL Gemini Notebook, vì URL là dữ liệu riêng của
  từng người học trên cùng một môn.
- `promptTemplateId` cho phép quản lý phiên bản nội dung prompt.
- Việc lưu câu trả lời AI làm lời giải chính thức chỉ được thực hiện bằng một hành động riêng sau khi người nhập dữ liệu kiểm tra và chủ động xác nhận.
