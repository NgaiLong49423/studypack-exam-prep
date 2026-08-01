# Image Ingestion Contract

Status: Accepted

Tài liệu này quy định luồng chuyển ngân hàng câu hỏi hoặc đề thi dạng ảnh thành
JSON có thể kiểm định trước khi nạp vào ứng dụng.

## 1. Nguyên tắc

- Ảnh là bằng chứng nguồn; LLM chỉ làm nhiệm vụ trích xuất.
- Kết quả đầu tiên luôn là `ImageImportBatch` trong staging (khu vực nhập tạm),
  chưa phải `Question` hoặc `Exam` chính thức.
- Không tự suy đoán nội dung không nhìn thấy, đáp án đúng, lời giải, Topic,
  độ khó hay metadata (thông tin mô tả) không có trong nguồn.
- Không tự cấp `questionId`, tự gộp câu trùng hoặc tự publish.
- Mỗi item phải truy ngược được tới đúng tệp ảnh nguồn.
- JSON chỉ được chuyển sang Exam Import khi qua kiểm tra tự động và Agent kiểm
  tra tổng quát độ sạch của dữ liệu.
- Agent lập trình như Codex hoặc Antigravity không có trách nhiệm mở và đối
  chiếu lại từng ảnh. Việc đọc ảnh thuộc về LLM chuyển đổi như ChatGPT hoặc
  Gemini.

## 2. Hai loại nguồn

`sourceKind` nhận một trong hai giá trị:

| Giá trị | Ý nghĩa |
|---|---|
| `question-bank` | Tập ảnh câu hỏi rời; không giả định chúng tạo thành một đề |
| `exam` | Ảnh của một đề cụ thể; cần giữ vị trí và thứ tự nguồn |

Nếu người dùng không xác nhận được loại nguồn, dừng và hỏi trước khi trích xuất.

## 3. Cấu trúc `ImageImportBatch`

```json
{
  "schemaVersion": "1.0",
  "batchId": "jpd123-sp26-c2-fe-images-001",
  "subjectId": "jpd123",
  "sourceKind": "exam",
  "examDraft": {
    "examIdHint": "jpd123-sp26-c2-fe",
    "title": "JPD123 Spring 2026 C2 FE",
    "declaredQuestionCount": 50
  },
  "items": [
    {
      "sourceRef": {
        "fileName": "IMG_0001.jpg",
        "pageIndex": 1,
        "region": null
      },
      "sourceOrder": 1,
      "originalNumber": 1,
      "stemBlocks": [
        {
          "type": "markdown",
          "text": "Nội dung câu hỏi"
        }
      ],
      "options": [
        {
          "sourceLabel": "A",
          "blocks": [
            {
              "type": "markdown",
              "text": "Lựa chọn A"
            }
          ]
        }
      ],
      "answer": {
        "sourceLabels": ["A"],
        "evidence": "explicit",
        "evidenceText": "Ảnh đánh dấu đáp án A"
      },
      "maxSelections": 1,
      "explanation": null,
      "topicIds": [],
      "extractionConfidence": 0.98,
      "needsReview": false,
      "issues": []
    }
  ],
  "batchIssues": []
}
```

## 4. Quy tắc trường dữ liệu

- `batchId` do người chạy import đặt; không dùng thay `questionId`.
- `subjectId` bắt buộc và phải tồn tại.
- `examDraft` bắt buộc khi `sourceKind = exam`, ngược lại phải là `null`.
- `sourceRef.fileName` phải khớp chính xác tên tệp trong ZIP.
- `pageIndex` là thứ tự xử lý ảnh, không tự xem là số câu.
- `sourceOrder` giữ thứ tự câu trong tập nguồn.
- `originalNumber` chỉ ghi khi nhìn thấy số câu; nếu không rõ dùng `null`.
- `stemBlocks` và `options[].blocks` giữ nguyên ngôn ngữ, dấu câu, công thức,
  code và xuống dòng có ý nghĩa.
- `sourceLabel` giữ nhãn gốc như `A`, `B`, `1`, `2`; chưa tạo option ID chính thức.
- `topicIds` luôn là `[]` ở bước trích xuất, trừ khi nguồn ghi Topic rõ ràng và
  người dùng yêu cầu nhập.
- `extractionConfidence` từ `0` đến `1` chỉ phản ánh độ chắc chắn khi đọc ảnh,
  không phản ánh độ đúng kiến thức.

## 5. Đáp án đúng và lời giải

### 5.1. Đáp án từ nguồn không mặc nhiên đúng tuyệt đối

Đáp án được nhìn thấy trong ảnh và đáp án đúng về mặt kiến thức là hai việc
khác nhau:

- `evidence: "explicit"` chỉ có nghĩa là ảnh có ghi hoặc đánh dấu lựa chọn đó.
  Nó không phải là giấy chứng nhận rằng lựa chọn đó đúng 100%.
- `extractionConfidence` chỉ cho biết Agent đọc chữ hoặc dấu đánh dấu chắc đến
  đâu; nó không đo độ đúng của kiến thức.
- Một câu có đáp án được đánh dấu rõ vẫn có thể cần xem xét lại nếu nguồn có
  thể sai, câu hỏi mơ hồ, đáp án phụ thuộc phiên bản tài liệu, hoặc Agent tìm
  được bằng chứng kỹ thuật đáng tin hơn.
- Khi có nghi ngờ về nội dung, không âm thầm sửa đáp án. Phải giữ lại bằng
  chứng nguồn, nêu lý do bằng ngôn ngữ đời thường và chờ chủ ngân hàng quyết
  định: giữ đáp án, đổi đáp án, giữ để xem xét sau hoặc bỏ câu.

Sau khi người dùng đã chốt, quyết định thủ công được ghi rõ là quyết định của
chủ ngân hàng, không được mô tả như đáp án chính thức xuất hiện trong ảnh.

`answer.evidence` nhận:

| Giá trị | Cách dùng |
|---|---|
| `explicit` | Nguồn đánh dấu hoặc ghi đáp án rõ ràng |
| `absent` | Nguồn không cung cấp đáp án |
| `unclear` | Có dấu hiệu đáp án nhưng không đọc chắc chắn |

Quy tắc:

- Chỉ điền `sourceLabels` khi bằng chứng là `explicit`.
- `sourceLabels` là đáp án được trích xuất hoặc đáp án đã được chủ ngân hàng
  chốt để app chấm; không được hiểu là luôn đúng về mặt kiến thức.
- Nếu không có đáp án, dùng `sourceLabels: []`, `evidence: "absent"` và
  `needsReview: true`.
- Không giải câu hỏi để tự tạo đáp án chính thức trong bước OCR.
- Chỉ trích xuất lời giải khi ảnh thực sự có lời giải; nếu không dùng `null`.
- Không biến lời giải do LLM suy luận thành dữ liệu nguồn.

Ngoại lệ có kiểm soát: sau khi chủ ngân hàng câu hỏi trực tiếp quyết định một
đáp án chưa có trong nguồn bên thứ ba, người nhập có thể dùng `explicit` để
cho phép app chấm bài. `evidenceText` bắt buộc phải ghi rõ đó là quyết định thủ
công, không phải đáp án chính thức từ ảnh; ví dụ: `Manual decision by question
bank owner: A; third-party source did not provide an official answer.` LLM OCR
không được tự tạo ngoại lệ này.

## 6. Ảnh chứa nhiều câu hoặc một câu có nhiều ảnh

- Một ảnh có nhiều câu: tạo nhiều item, cùng `fileName`, và ghi `region` mô tả
  vùng như `top`, `middle`, `bottom` hoặc tọa độ nếu công cụ hỗ trợ.
- Một câu trải qua nhiều ảnh: tạo một item và cho `sourceRef` thành danh sách ở
  phiên bản triển khai; không được tự ghép nếu không chắc hai ảnh là cùng câu.
- Ảnh trùng byte hoặc trùng nội dung vẫn phải được báo trong `batchIssues`;
  không tự xóa.

## 7. Issue khi trích xuất

Mỗi issue có dạng:

```json
{
  "severity": "error",
  "code": "UNREADABLE_OPTION",
  "field": "items[12].options[2]",
  "sourceFile": "IMG_0013.jpg",
  "message": "Không đọc chắc chắn nội dung lựa chọn C."
}
```

Các mã tối thiểu:

- `UNREADABLE_QUESTION`
- `UNREADABLE_OPTION`
- `ANSWER_NOT_PROVIDED`
- `ANSWER_MARK_UNCLEAR`
- `QUESTION_NUMBER_UNCLEAR`
- `POSSIBLE_MISSING_IMAGE`
- `POSSIBLE_DUPLICATE_IMAGE`
- `MULTIPLE_QUESTIONS_IN_IMAGE`
- `SOURCE_ORDER_UNCERTAIN`
- `UNSUPPORTED_CONTENT`

Không thay văn bản mơ hồ bằng nội dung bịa để làm hết issue.

## 8. Kiểm tra và tự sửa có kiểm soát trong bước chuyển ảnh

LLM chuyển ảnh sang `ImageImportBatch` phải kiểm tra toàn bộ ZIP trước khi trả
JSON, bao gồm tệp hỏng hoặc không mở được, tệp không phải ảnh được hỗ trợ, ảnh
trống/không đọc được, ảnh trùng, ảnh thiếu, sai thứ tự và ảnh có nội dung không
phải câu hỏi. Mọi vấn đề cấp tệp phải ghi vào `batchIssues` kèm đúng tên tệp.

LLM được phép tự sửa các lỗi kỹ thuật hoặc lỗi chép chữ có căn cứ rõ ràng, ví dụ
chuẩn hóa khoảng trắng, sửa ký tự OCR rõ ràng nhờ ngữ cảnh, hoặc sửa cấu trúc
JSON. LLM không được tự sửa theo suy đoán các phần làm thay đổi ý nghĩa như
đáp án đúng, nội dung bị khuất, lời giải, Topic, nguồn hoặc thứ tự ảnh.

Mỗi lần tự sửa phải ghi vào `repairLog` trong cùng JSON, gồm tên ảnh, vị trí,
hành động, nội dung trước và sau, lý do, cùng `needsReview`. Nếu sửa có thể làm
thay đổi ý nghĩa câu hỏi hoặc đáp án thì bắt buộc đặt `needsReview: true` và tạo
issue tương ứng. Nếu không thể sửa có căn cứ, giữ nguyên phần chưa chắc chắn,
đặt `needsReview: true` và báo issue thay vì bịa nội dung.

`repairLog` là nhật ký minh bạch để Agent kiểm tra và người dùng biết LLM đã tự
động làm gì trong chính lần xuất lô đó; nó không biến bản sửa thành đáp án đúng
tuyệt đối. LLM luôn phải trả `repairLog`, kể cả khi danh sách rỗng. Người dùng
đọc báo cáo ngay khi nhận JSON của lô; không bắt buộc phải lưu nhật ký này vào
Question Bank hoặc theo dõi nó trong các bước import tiếp theo.

## 9. Quy tắc Agent trao đổi khi cần người dùng xem xét

Khi phát hiện câu có vấn đề về đáp án, nội dung, ảnh hoặc khả năng sử dụng,
Agent phải:

1. Chỉ rõ câu nào, nội dung đang có là gì và bằng chứng đang có.
2. Luôn ghi rõ `sourceRef.fileName` (tên ảnh), `pageIndex` (vị trí/thứ tự ảnh)
   và `region` hoặc tọa độ nếu có, để người dùng mở đúng ảnh đối chứng.
3. Giải thích vấn đề bằng ngôn ngữ đời thường: người học sẽ thấy gì, vì sao có
   thể gây hiểu sai hoặc chấm sai, và mức ảnh hưởng là gì.
4. Nếu phải nhắc đến tên trường dữ liệu hoặc thuộc tính kỹ thuật, phải giải
   thích ngay tác dụng của nó; không dùng tên kỹ thuật thay cho lời giải thích.
5. Nếu có thể, tìm bằng chứng độc lập đáng tin cậy và nói rõ đó là bằng chứng
   tham khảo, không phải sự chắc chắn tuyệt đối.
6. Đưa ra các lựa chọn rõ ràng: giữ, đổi đáp án, xem xét sau hoặc bỏ câu.
7. Dừng và chờ người dùng chốt. Không tự sửa, tự xóa hoặc tự publish.

Agent phải giữ danh sách các quyết định đã chốt và chỉ áp dụng các thay đổi dữ
liệu sau khi người dùng hoàn tất vòng xem xét, trừ khi người dùng yêu cầu sửa
ngay một câu cụ thể.

## 10. Agent kiểm tra độ sạch trước khi nạp

Agent lập trình chỉ làm việc trên JSON, schema, contract và ngân hàng hiện có.
Agent không cần nhận ZIP ảnh và không đối chiếu nội dung từng item với ảnh.

1. Kiểm JSON parse được và đúng schema.
2. Kiểm trường bắt buộc, kiểu dữ liệu, giá trị enum và định dạng ID.
3. Kiểm nội dung rỗng, option thiếu/trùng, nhãn trùng, đáp án tham chiếu sai và
   các ký tự lỗi thường gặp do OCR.
4. Kiểm số item, `sourceOrder`, `originalNumber` và số câu khai báo bằng dữ
   liệu JSON; không suy ra lại từ ảnh.
5. Kiểm `subjectId`, Exam, Question, asset và các tham chiếu chéo tồn tại.
6. Phát hiện câu trùng chắc chắn hoặc nghi trùng bằng dữ liệu hiện có; không tự
   gộp trường hợp mơ hồ.
7. Kiểm các cờ và issue do LLM để lại; không tự xác nhận rằng nội dung khớp ảnh.
8. Chạy Validation Contract và tạo báo cáo pass/fail cùng danh sách vị trí cần
   người dùng sửa.

Chỉ được chuyển batch sang Exam Import khi:

- không có `error`;
- mọi item đều có `needsReview: false`;
- mọi tham chiếu dữ liệu cần cho app đều tồn tại;
- đáp án cần thiết có cấu trúc hợp lệ và không còn bị LLM đánh dấu mơ hồ;
- người dùng đã giải quyết các trường hợp nghi trùng.

`PASS` của Agent chỉ có nghĩa là dữ liệu đạt các quy tắc có thể kiểm tra từ
JSON và ngân hàng hiện có. Nó không chứng minh LLM đã đọc ảnh chính xác tuyệt
đối. Nếu cần xác minh một câu với ảnh nguồn, đó là bước kiểm tra thủ công do
người dùng chủ động yêu cầu, không phải bước bắt buộc của pipeline.

## 11. Phân chia trách nhiệm tài liệu

- `README.md`: giải thích ngắn luồng nhập cho con người.
- `AGENTS.md`: quy tắc bắt buộc Agent lập trình phải tuân thủ khi kiểm tra dữ
  liệu.
- `prompts/IMAGE-TO-JSON-PROMPT.md`: prompt có thể sao chép sang LLM.
- `prompts/CLEAN-DATA-IMPORT-PROMPT.md`: prompt cho Codex/Antigravity kiểm tra
  tổng quát JSON trước khi nạp.
- JSON Schema: kiểm cấu trúc tự động; không khẳng định độ chính xác so với ảnh.

## 12. Bất biến

- Không nạp thẳng output OCR/LLM vào ngân hàng chính.
- Không bịa dữ liệu để vượt validation.
- Không dùng độ tự tin của LLM làm bằng chứng đáp án.
- Không mất nhật ký tự sửa trong `repairLog`.
- Không coi đáp án được đánh dấu trong nguồn là đúng tuyệt đối; đáp án có thể
  được chủ ngân hàng xem xét và sửa lại sau khi có bằng chứng phù hợp.
- Không mất liên kết giữa item và ảnh nguồn.
- Không để câu thiếu đáp án được publish nếu app cần chấm tự động.
