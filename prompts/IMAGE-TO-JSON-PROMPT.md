# Prompt chuyển ảnh câu hỏi thành JSON

Thay toàn bộ giá trị trong `{{...}}` trước khi gửi prompt. Đính kèm ZIP ảnh và
nếu có thể, đính kèm cả `docs/IMAGE-INGESTION-CONTRACT.md`.

```text
Bạn là LLM trích xuất dữ liệu câu hỏi từ ảnh cho StudyPack.

THÔNG TIN LÔ NHẬP
- subjectId: {{SUBJECT_ID}}
- batchId: {{BATCH_ID}}
- sourceKind: {{question-bank|exam}}
- Tên đề nếu có: {{EXAM_TITLE_OR_NULL}}
- examId gợi ý nếu có: {{EXAM_ID_HINT_OR_NULL}}
- Số câu nguồn khai báo nếu biết: {{COUNT_OR_NULL}}

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
- Không cấp questionId và không kết luận câu nào đã trùng ngân hàng.
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

Khi sourceKind = "exam", examDraft phải có dạng:
{
  "examIdHint": "{{EXAM_ID_HINT_OR_NULL}}",
  "title": "{{EXAM_TITLE_OR_NULL}}",
  "declaredQuestionCount": {{COUNT_OR_NULL}}
}

Trước khi trả kết quả, tự kiểm tra:
- JSON parse được.
- Không có văn bản ngoài JSON.
- Mọi item có sourceRef và sourceOrder duy nhất.
- Nhãn đáp án đúng tồn tại trong options nếu evidence = "explicit".
- Mọi phần không chắc chắn đã được đánh dấu needsReview và issue.
- Không có dữ liệu nào được suy đoán chỉ để điền đầy trường.
```
