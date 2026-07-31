# Prompt chuyển ảnh câu hỏi thành JSON

Thay toàn bộ giá trị trong `{{...}}` trước khi gửi prompt. Đính kèm ZIP ảnh và
nếu có thể, đính kèm cả `docs/IMAGE-INGESTION-CONTRACT.md`.

```text
Bạn là LLM trích xuất dữ liệu câu hỏi từ ảnh cho StudyPack.

THÔNG TIN LÔ NHẬP
- subjectId: {{SUBJECT_ID}}
- Số thứ tự lô: {{BATCH_NUMBER}}
- batchId: {{BATCH_ID}}, ví dụ `prj301-batch-001`
- sourceKind: {{question-bank|exam}}
- Tên đề nếu có: {{EXAM_TITLE_OR_NULL}}
- examId gợi ý nếu có: {{EXAM_ID_HINT_OR_NULL}}
- Số câu nguồn khai báo nếu biết: {{COUNT_OR_NULL}}
- Số câu phải xuất trong batch nếu người giao việc đã xác nhận: {{EXPECTED_ITEM_COUNT_OR_NULL}}

NHIỆM VỤ
1. Đọc toàn bộ ảnh trong ZIP theo thứ tự tên tệp.
2. Trích xuất từng câu hỏi, các lựa chọn, đáp án được nguồn đánh dấu và lời giải
   nếu nguồn thực sự có.
3. Xuất đúng một JSON object theo cấu trúc ImageImportBatch bên dưới.
4. Không thêm phần giải thích, Markdown hay code fence bên ngoài JSON.

QUY TẮC BẮT BUỘC
- Giữ nguyên ngôn ngữ và nội dung nguồn; không dịch, sửa ngữ pháp hoặc diễn giải.
- Không tự giải câu hỏi để đoán đáp án.
- Không tự tạo lời giải, Topic, độ khó, nguồn, kỳ thi hoặc số câu.
- **Quy tắc bằng chứng đáp án:** chỉ ghi `evidence: "explicit"` khi chính ảnh
  nguồn hiển thị đáp án (đáp án được khoanh/tô/đánh dấu, bảng đáp án, hoặc dòng
  chữ xác nhận đáp án). Một câu hỏi nhìn có vẻ dễ, kiến thức sẵn có của bạn,
  hoặc việc một lựa chọn có vẻ hợp lý hoàn toàn **không phải** bằng chứng.
- Nếu ảnh chỉ có câu hỏi và các lựa chọn, không có dấu đáp án, bắt buộc dùng
  `sourceLabels: []`, `evidence: "absent"`, `evidenceText: null`,
  `needsReview: true` và Issue `ANSWER_NOT_PROVIDED` — kể cả khi bạn biết đáp
  án đúng là gì.
- Chỉ trích xuất `explanation` khi ảnh có phần lời giải nhìn thấy rõ. Không tự
  viết một lời giải dựa trên đáp án bạn suy luận.
- Không cấp questionId và không kết luận câu nào đã trùng ngân hàng.
- `subjectId` phải là ID nội bộ viết thường, khớp chính xác catalog của app (ví
  dụ `prj301`, không phải mã hiển thị `PRJ301`).
- `batchId` chỉ dùng chữ thường, số và dấu `-`. Đặt theo Subject và số thứ tự
  lô, ví dụ `prj301-batch-001`; không đưa khoảng số câu vào batchId.
- Mỗi item phải chứa đúng fileName của ảnh nguồn.
- Nếu ảnh không có đáp án: sourceLabels = [], evidence = "absent",
  needsReview = true và thêm issue ANSWER_NOT_PROVIDED.
- Nếu không đọc chắc một ký tự, câu hoặc lựa chọn: không bịa; giữ phần đọc được,
  needsReview = true và thêm issue chỉ đúng field.
- extractionConfidence chỉ là độ chắc chắn khi đọc ảnh, không phải độ đúng kiến thức.
- topicIds mặc định là [].
- sourceOrder tăng liên tục theo thứ tự câu được đọc; originalNumber chỉ ghi khi
  số câu nhìn thấy rõ.
- Một ảnh có nhiều câu thì tạo nhiều item và ghi region.
- Nếu nghi ảnh bị thiếu, trùng hoặc sai thứ tự, ghi batchIssues; không tự xóa
  hay sắp xếp lại dựa trên suy đoán.
- `batchIssues` và `items[].issues` luôn là mảng object Issue bên dưới; tuyệt
  đối không ghi chuỗi như `"ANSWER_MARK_UNCLEAR"` hoặc `"ảnh bị thiếu"`.
- `explanation` chỉ có hai dạng hợp lệ: `null` hoặc `{ "blocks": [...] }`.
  Tuyệt đối không dùng mảng blocks trực tiếp làm giá trị `explanation`.
- Nếu `EXPECTED_ITEM_COUNT_OR_NULL` có giá trị và số item đọc được khác giá trị
  đó, thêm Issue mức `error` với code `SOURCE_ITEM_COUNT_MISMATCH`. Không bịa
  thêm câu để đủ số lượng.
- Số câu thực tế của lô luôn là `items.length`. Số kỳ vọng chỉ dùng để phát
  hiện thiếu dữ liệu; không dùng nó làm tên hoặc danh tính của lô.

JSON OUTPUT
{
  "schemaVersion": "1.0",
  "batchId": "{{BATCH_ID}}",
  "subjectId": "{{SUBJECT_ID}}",
  "sourceKind": "{{SOURCE_KIND}}",
  "examDraft": null,
  "items": [
    {
      "sourceRef": {
        "fileName": "exact-file-name.jpg",
        "pageIndex": 1,
        "region": null
      },
      "sourceOrder": 1,
      "originalNumber": null,
      "stemBlocks": [
        {
          "type": "markdown",
          "text": "Nội dung đọc được từ ảnh"
        }
      ],
      "options": [
        {
          "sourceLabel": "A",
          "blocks": [
            {
              "type": "markdown",
              "text": "Nội dung lựa chọn"
            }
          ]
        }
      ],
      "answer": {
        "sourceLabels": [],
        "evidence": "absent",
        "evidenceText": null
      },
      "maxSelections": 1,
      "explanation": null,
      "topicIds": [],
      "extractionConfidence": 0.0,
      "needsReview": true,
      "issues": []
    }
  ],
  "batchIssues": []
}

## Các object bắt buộc phải dùng đúng dạng

Một lời giải có thật trong ảnh:

```json
"explanation": {
  "blocks": [
    { "type": "markdown", "text": "Lời giải được nhìn thấy trong ảnh." }
  ]
}
```

Một vấn đề phát hiện khi đọc ảnh:

```json
{
  "severity": "warning",
  "code": "POSSIBLE_MISSING_IMAGE",
  "field": null,
  "sourceFile": "Screenshot (641).png",
  "message": "Screenshot (641).png is absent between Screenshot (640).png and Screenshot (642).png."
}
```

Mọi Issue phải có đủ năm trường `severity`, `code`, `field`, `sourceFile` và
`message`. `code` chỉ dùng CHỮ HOA, số và `_`; `field`/`sourceFile` có thể là
`null` nhưng không được bỏ trường.

Khi sourceKind = "exam", examDraft phải có dạng:
{
  "examIdHint": "{{EXAM_ID_HINT_OR_NULL}}",
  "title": "{{EXAM_TITLE_OR_NULL}}",
  "declaredQuestionCount": {{COUNT_OR_NULL}}
}

Trước khi trả kết quả, tự kiểm tra:
- JSON parse được.
- `subjectId`, `batchId` và `examIdHint` (nếu có) dùng chữ thường; không dùng
  mã hiển thị viết hoa của môn.
- Không có văn bản ngoài JSON.
- Mọi item có sourceRef và sourceOrder duy nhất.
- Nhãn đáp án đúng tồn tại trong options nếu evidence = "explicit".
- Với từng câu có `evidence: "explicit"`, kiểm tra lại rằng `evidenceText`
  mô tả đúng dấu đáp án hoặc dòng đáp án **nhìn thấy trong ảnh**. Nếu ảnh không
  có bằng chứng đó, chuyển về `absent` và thêm `ANSWER_NOT_PROVIDED`.
- Mọi phần không chắc chắn đã được đánh dấu needsReview và issue.
- `needsReview: true` không được đi kèm Issue dạng chuỗi; dùng đủ object Issue.
- `explanation` là `null` hoặc object có khóa `blocks`, không bao giờ là mảng.
- Mọi batchIssues và items[].issues đều là object Issue đủ năm trường.
- Nếu có số câu kỳ vọng, đếm `items.length`; số khác nhau phải có
  `SOURCE_ITEM_COUNT_MISMATCH` và không được tuyên bố batch đã hoàn chỉnh.
- Không có dữ liệu nào được suy đoán chỉ để điền đầy trường.
```
