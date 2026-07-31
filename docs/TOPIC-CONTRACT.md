# Topic Contract

Status: Accepted

## 1. Phạm vi

`Topic` là chủ đề kiến thức tùy chọn bên trong một môn, ví dụ `Stack`,
`Queue`, `Binary Search Tree` hoặc `Ngữ pháp bài 15`.

`Exam` là một đề thi cụ thể. Đề thi có thể chứa câu hỏi thuộc nhiều Topic,
nhưng bản thân đề thi không phải Topic. Câu hỏi liên kết với đề qua
`ExamItem`, không qua `topicIds`.

Topic chỉ hỗ trợ phân loại, lọc, luyện tập và báo cáo. Việc chưa phân loại
không được ngăn câu hỏi tham gia ngân hàng, Random All, đề thi, lịch sử học
hoặc xuất Markdown.

## 2. Tệp Topic của môn

Nếu môn sử dụng Topic, dữ liệu nằm tại:

```text
subjects/{subjectId}/topics.json
```

Tệp này là tùy chọn. Môn không có `topics.json` vẫn hợp lệ.

```json
{
  "schemaVersion": "1.0",
  "subjectId": "csd201",
  "topics": [
    {
      "topicId": "csd201-data-structures",
      "name": "Data Structures",
      "description": "Các cấu trúc dữ liệu cơ bản.",
      "parentTopicId": null,
      "order": 1,
      "status": "published"
    },
    {
      "topicId": "csd201-stack",
      "name": "Stack",
      "description": "Ngăn xếp và nguyên tắc LIFO.",
      "parentTopicId": "csd201-data-structures",
      "order": 1,
      "status": "published"
    }
  ]
}
```

Mỗi Topic gồm:

- `topicId`: ID ổn định, duy nhất, có dạng `{subjectId}-{topic-slug}`.
- `name`: tên hiển thị bắt buộc.
- `description`: mô tả tùy chọn.
- `parentTopicId`: Topic cha cùng môn hoặc `null`.
- `order`: thứ tự trong cùng cấp.
- `status`: `draft`, `published` hoặc `archived`.

`topic-slug` chỉ dùng chữ thường, số và dấu gạch ngang.

## 3. Gắn Topic vào Question

Một câu có thể thuộc nhiều Topic:

```json
{
  "questionId": "csd201-q-0042",
  "subjectId": "csd201",
  "topicIds": [
    "csd201-stack",
    "csd201-complexity"
  ]
}
```

`topicIds` là tùy chọn. Cả ba dạng đầu vào sau đều được chấp nhận:

```json
{}
```

```json
{ "topicIds": null }
```

```json
{ "topicIds": [] }
```

Khi đọc hoặc nhập dữ liệu, hệ thống phải chuẩn hóa cả ba dạng thành:

```json
{ "topicIds": [] }
```

Mảng rỗng là dạng chuẩn khi lưu lại. Không nhân bản Question chỉ để đưa một
câu vào nhiều Topic.

## 4. Câu chưa được phân loại

Câu có `topicIds: []`:

- vẫn được `published`;
- vẫn xuất hiện trong ngân hàng và Random All;
- vẫn dùng được trong Exam;
- vẫn lưu lịch sử và tính tiến độ theo `questionId`;
- vẫn được xuất Markdown;
- chỉ bị bỏ qua khi người dùng chọn riêng chế độ **Luyện theo chủ đề**.

Validator tạo issue không chặn:

```json
{
  "severity": "info",
  "code": "QUESTION_HAS_NO_TOPIC",
  "questionId": "csd201-q-0043",
  "field": "topicIds",
  "message": "Câu hỏi chưa được phân loại theo chủ đề."
}
```

Giao diện có thể hiển thị nhãn **Chưa phân loại — cần cải thiện dữ liệu** và
các bộ lọc:

- Tất cả câu hỏi.
- Đã phân loại.
- Chưa phân loại.
- Topic tham chiếu không còn hợp lệ.

Không được tự suy luận hoặc tự ghi Topic từ nội dung câu hỏi. Người dùng hoặc
Agent chỉ bổ sung `topicIds` khi có yêu cầu phân loại riêng.

## 5. Quan hệ cha–con

Topic có thể tạo thành cây:

- Topic gốc có `parentTopicId: null`.
- Topic con phải trỏ đến Topic tồn tại trong cùng môn.
- Topic không được làm cha của chính nó.
- Cây không được có vòng lặp.

Khi chọn một Topic cha để luyện, mặc định bao gồm toàn bộ Topic con. Giao diện
có thể cho tắt **Bao gồm chủ đề con** để chỉ lấy câu gắn trực tiếp.

## 6. Luyện tập theo Topic

Khi người dùng chọn một hoặc nhiều Topic:

1. Lấy câu hợp lệ thuộc các Topic đã chọn và Topic con nếu được bật.
2. Gộp theo `questionId` để một câu thuộc nhiều Topic chỉ xuất hiện một lần.
3. Áp dụng thuật toán tần suất `35% – 25% – 20% – 12% – 8%`.
4. Không lặp Question trong cùng lượt.

Nếu số câu đã phân loại ít hơn số lượng yêu cầu, lượt luyện dùng số câu thực
tế và thông báo cho người dùng; không lấy câu chưa phân loại và không lặp câu
để bù.

Random All và làm theo Exam không chạy bộ lọc Topic.

## 7. Tiến độ theo Topic

Không lưu một nguồn tiến độ riêng cho Topic. Báo cáo được tính từ lịch sử các
Question đang thuộc Topic:

```text
topicAccuracy =
  tổng số lần trả lời đúng của các câu thuộc Topic
  / tổng số lần trả lời các câu thuộc Topic
```

Chỉ tính câu đã có ít nhất một kết quả. Nếu một Question thuộc nhiều Topic,
kết quả chỉ được lưu một lần nhưng có thể được dùng trong báo cáo của từng
Topic liên quan.

Việc thay đổi `topicIds` có thể làm báo cáo Topic thay đổi, nhưng không sửa
hoặc nhân đôi lịch sử gốc.

## 8. Trạng thái và chỉnh sửa

- `draft`: đang biên tập, không dùng cho bộ lọc luyện tập thông thường.
- `published`: có thể chọn để luyện.
- `archived`: không dùng cho lượt mới nhưng vẫn giữ tham chiếu và lịch sử cũ.

Có thể sửa `name`, `description`, `order` và `parentTopicId`. Không đổi trực
tiếp `topicId` đã được sử dụng; thao tác đổi ID phải cập nhật đồng thời mọi
`Question.topicIds` và tham chiếu liên quan.

Không xóa cứng Topic đã được Question hoặc lịch sử tham chiếu. Việc lưu trữ
Topic không xóa Question và không làm Question mất trạng thái `published`.

## 9. Validation

Các lỗi `error`:

- Thiếu hoặc trùng `topicId`.
- `topicId` sai định dạng hoặc không bắt đầu bằng đúng `subjectId`.
- Thiếu `name`.
- Topic cha không tồn tại, thuộc môn khác hoặc tạo vòng lặp.
- `Question.topicIds` chứa Topic không tồn tại hoặc thuộc môn khác.
- `Question.topicIds` chứa ID trùng nhau.

Các cảnh báo `warning`:

- Topic không có Question nào.
- Question được gắn từ năm Topic trở lên.
- Cây Topic quá sâu.
- Hai Topic cùng cấp có tên gần giống nhau.
- Topic `archived` vẫn được nhiều Question tham chiếu.

Các thông tin `info`:

- Question chưa có Topic sau khi chuẩn hóa.

Thiếu `topics.json`, thiếu `topicIds`, `topicIds: null` hoặc `topicIds: []`
không phải `error` và không phải `warning`.

## 10. Quyết định cốt lõi

- Topic là chủ đề kiến thức; Exam không phải Topic.
- Topic và `topicIds` đều là tùy chọn.
- Câu chưa có Topic vẫn được phát hành và sử dụng đầy đủ.
- Dữ liệu thiếu Topic chỉ nhận `QUESTION_HAS_NO_TOPIC` ở mức `info`.
- Dạng lưu chuẩn của câu chưa phân loại là `topicIds: []`.
- Hệ thống không tự phân loại nếu người dùng chưa yêu cầu.
