# Exam Contract

Status: Accepted

## Vai trò

`Exam` đại diện cho một đề cụ thể và giữ nguyên cấu trúc nguồn. `Exam` không
phải Topic và không chứa bản sao độc lập của nội dung câu hỏi.

- `Question`: nội dung dùng chung trong ngân hàng câu hỏi.
- `ExamItem`: một vị trí thực tế của Question trong đề.
- `ExamSection`: khu vực hoặc phần có trong đề nguồn.

Một Question có thể xuất hiện trong nhiều đề hoặc nhiều vị trí của cùng một đề.

## Vị trí lưu

```text
subjects/{subjectId}/exams/{examId}.json
```

Tên tệp phải khớp `examId`. ID dùng chữ thường, số và dấu gạch ngang, bắt đầu
bằng `subjectId` và không được tùy tiện đổi sau khi đã sử dụng.

## Cấu trúc

```json
{
  "schemaVersion": "1.0",
  "examId": "jpd123-sp26-c2-fe",
  "subjectId": "jpd123",
  "title": "JPD123 Spring 2026 C2 FE",
  "examType": "FE",
  "term": "SP26",
  "source": {
    "name": "FuOverflow Community",
    "url": null,
    "note": "Chuyển đổi từ bộ ảnh đề thi."
  },
  "status": "published",
  "declaredQuestionCount": 50,
  "sections": [],
  "items": [
    {
      "examItemId": "jpd123-sp26-c2-fe-item-001",
      "order": 1,
      "originalNumber": 1,
      "sectionId": null,
      "questionId": "jpd123-q-0101",
      "questionVersion": 1
    }
  ]
}
```

Các trường bắt buộc là `schemaVersion`, `examId`, `subjectId`, `title`,
`status` và `items`. Những metadata (thông tin mô tả) khác là tùy chọn và không
được suy đoán khi nguồn không cung cấp.

## ExamItem

- `examItemId`: ID duy nhất của vị trí.
- `order`: thứ tự ứng dụng hiển thị.
- `originalNumber`: số câu trên tài liệu nguồn.
- `sectionId`: Section chứa câu hoặc `null`.
- `questionId`: Question trong ngân hàng.
- `questionVersion`: phiên bản nội dung được đề sử dụng.

Tách `order` khỏi `originalNumber` để vẫn biểu diễn được đề thiếu trang, đánh số
từ một số khác 1 hoặc nhiều Section đánh số lại từ đầu.

Đề đã xuất bản giữ `questionVersion` đã tham chiếu. Question có phiên bản mới
không tự làm thay đổi đề cũ.

## Section

Section là bố cục của đề, không phải chủ đề kiến thức. Nếu nguồn không chia
phần, dùng `sections: []` và `sectionId: null`; không bắt buộc tạo Section giả.

## Bất biến dữ liệu

- Thứ tự ExamItem mặc định giữ nguyên thứ tự đề nguồn.
- Tổng số câu của đề và từng Section được tính bằng ExamItem.
- Hai ExamItem có thể trỏ đến cùng một Question.
- Nếu nguồn lặp một câu hai lần, vẫn giữ hai ExamItem và tạo cảnh báo.
- Gộp Question không được xóa ExamItem, đổi thứ tự hoặc chuyển Section.
- Đề 50 câu vẫn phải có 50 ExamItem sau khi gộp.
- Làm theo đề không dùng thuật toán chọn câu, không loại câu trùng và không phụ
  thuộc Topic hoặc độ khó.
- Tùy chọn trộn câu chỉ thay đổi lượt làm hiện tại, không sửa JSON.

## Số lượng và trạng thái

- `declaredQuestionCount` là số câu nguồn khai báo; số thực tế là `items.length`.
- Nếu chưa biết số câu nguồn, dùng `null`.
- `draft` có thể thiếu câu hoặc còn tham chiếu chưa hoàn thiện.
- `published` phải có ít nhất một ExamItem, không có lỗi và khớp số câu đã khai
  báo nếu `declaredQuestionCount` khác `null`.
- `archived` không dùng cho lượt mới nhưng vẫn giữ lịch sử.
- Không xóa cứng Exam đã có lượt làm.

## Làm và chấm đề

```text
Tỷ lệ đúng = số ExamItem trả lời đúng / tổng số ExamItem trong đề × 100
```

- Mọi ExamItem có trọng số như nhau.
- Sai hoặc bỏ trống được tính là không đúng.
- Kết quả gồm số đúng, tỷ lệ đúng và danh sách đúng/sai/chưa làm.
- Không có độ khó, điểm qua môn, trọng số riêng hoặc công thức trường học.

## Validation

`error`:

- Thiếu, trùng hoặc sai định dạng `examId`; ID không khớp tên tệp.
- Subject không tồn tại hoặc không khớp.
- Exam published không có ExamItem.
- Trùng `examItemId` hoặc `order`.
- Question, Question version hoặc Section được tham chiếu không tồn tại.
- Question thuộc môn khác.
- Exam published không khớp `declaredQuestionCount` đã khai báo.

`warning`:

- Question lặp trong đề.
- Thứ tự có khoảng trống.
- Thiếu nguồn, học kỳ, loại đề hoặc Section.
- Exam draft chưa đủ số câu đã khai báo.

`info`:

- Không có URL nguồn hoặc ngày thi chính xác.
- Câu trong đề chưa có Topic.

Topic, độ khó, học kỳ, loại đề, ngày thi, URL nguồn và Section không phải điều
kiện xuất bản.
