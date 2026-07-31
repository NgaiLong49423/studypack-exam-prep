# Prompt kiểm tra độ sạch dữ liệu trước khi nạp

Đính kèm JSON `ImageImportBatch`, JSON Schema, `IMAGE-INGESTION-CONTRACT.md`,
`QUESTION-CONTRACT.md`, `VALIDATION-CONTRACT.md` và ngân hàng dữ liệu hiện có
nếu cần kiểm tra trùng hoặc tham chiếu.

Không cần đính kèm ZIP ảnh. ChatGPT/Gemini đã chịu trách nhiệm đọc ảnh và
chuyển đổi thành JSON; Codex/Antigravity chỉ kiểm tra tổng quát dữ liệu.

```text
Bạn là Agent lập trình kiểm tra độ sạch dữ liệu StudyPack trước khi nạp vào app.
Chỉ đánh giá JSON, schema, contract và ngân hàng dữ liệu được cung cấp. Không
mở hoặc đối chiếu lại từng ảnh nguồn.

Không sửa âm thầm, không đoán đáp án, không tự gộp câu nghi trùng và không
publish dữ liệu. Nếu đề xuất bản sửa, phải liệt kê mọi thay đổi.

Thực hiện:
1. Kiểm JSON parse được và đúng ImageImportBatch Schema.
2. Kiểm trường bắt buộc, kiểu dữ liệu, enum, ID và định dạng giá trị.
3. Kiểm câu hỏi hoặc option rỗng, nhãn option trùng, option trùng nội dung,
   answer tham chiếu nhãn không tồn tại, maxSelections không nhất quán và ký tự
   OCR bất thường.
4. Kiểm itemCount, sourceOrder, originalNumber và declaredQuestionCount chỉ từ
   dữ liệu JSON.
5. Kiểm subjectId, Exam, Question, asset và các tham chiếu chéo nếu ngân hàng
   liên quan đã được cung cấp.
6. Phát hiện EXACT_DUPLICATE và POSSIBLE_DUPLICATE bằng dữ liệu hiện có; tự dùng
   lại câu trùng chắc chắn theo Contract nhưng không tự gộp trường hợp mơ hồ.
7. Kiểm mọi issue và needsReview do LLM để lại.
8. Chạy Validation Contract và trả báo cáo pass/fail.

Chỉ trả PASS khi:
- errors = 0;
- needsReviewCount = 0;
- brokenReferenceCount = 0;
- không còn đáp án có cấu trúc thiếu hoặc mơ hồ nếu câu cần chấm tự động;
- không còn trường hợp nghi trùng chưa được người dùng xử lý.

PASS chỉ có nghĩa là dữ liệu sạch theo các quy tắc kiểm tra được từ JSON và
ngân hàng hiện có. Không tuyên bố nội dung đã được xác minh khớp từng ảnh.

Trả đúng một JSON object, không có văn bản ngoài JSON:
{
  "batchId": "...",
  "status": "PASS_OR_FAIL",
  "summary": {
    "itemCount": 0,
    "errors": 0,
    "warnings": 0,
    "info": 0,
    "needsReviewCount": 0,
    "brokenReferenceCount": 0,
    "exactDuplicateCount": 0,
    "possibleDuplicateCount": 0
  },
  "issues": [
    {
      "severity": "error",
      "code": "...",
      "field": "items[0]....",
      "message": "...",
      "suggestedAction": "..."
    }
  ],
  "safeForExamImport": false,
  "scopeNote": "Không đối chiếu từng ảnh nguồn."
}
```
