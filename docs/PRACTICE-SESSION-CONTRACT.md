# Practice Session Contract

Status: Partially accepted

Tài liệu này mô tả một lượt làm câu hỏi và các quyết định đã được chốt trong
quá trình phân rã. Những mục còn mở phải được duyệt trước khi Contract chuyển
sang trạng thái `Accepted`.

## 1. Mô hình chung

Mọi lượt làm câu hỏi dùng chung thực thể `PracticeSession`, bao gồm luyện từ
ngân hàng và làm lại đề cũ. Mỗi vị trí trong lượt là một
`QuestionAttempt`.

- `PracticeSession` giữ nguồn câu hỏi, cài đặt, thứ tự cố định và trạng thái
  của cả lượt.
- `QuestionAttempt` giữ câu hỏi, phiên bản, thứ tự đáp án và kết quả tại một
  vị trí.
- Làm lại luôn tạo session mới; không ghi đè lịch sử cũ.
- Khi session bắt đầu, danh sách câu, phiên bản câu và thứ tự hiển thị phải
  được cố định để có thể tiếp tục chính xác sau khi đóng app.

Không tạo một mô hình `ExamAttempt` riêng. Làm đề cũ là `PracticeSession` có
`mode: "exam"` và tham chiếu `examId`.

## 2. Chế độ và nguồn câu hỏi

### `practice`

Luyện từ ngân hàng theo Subject, một hoặc nhiều Topic và các bộ lọc như:

- tất cả câu;
- câu chưa từng làm;
- câu cần ôn lại;
- kết hợp các bộ lọc được app hỗ trợ.

### `exam`

Làm lại một đề cũ:

- lấy đúng các `ExamItem`;
- mặc định giữ nguyên thứ tự câu và đáp án;
- không loại câu xuất hiện lặp trong đề;
- không thêm câu ngoài đề.

### `custom`

Danh sách câu được người dùng hoặc một tính năng khác lựa chọn. Chế độ này có
thể triển khai sau nhưng cấu trúc dữ liệu được phép hỗ trợ.

## 3. Trạng thái session

| Giá trị | Ý nghĩa |
| --- | --- |
| `in_progress` | Đang làm hoặc đã thoát app nhưng chưa nộp |
| `completed` | Đã nộp và kết quả đã được khóa |
| `abandoned` | Người dùng chủ động bỏ lượt |
| `invalidated` | Dữ liệu hỏng và không được tính vào tiến độ |

Không cần `paused`. Session `in_progress` cùng `lastActiveAt` đủ để tiếp tục
bài đang làm.

## 4. QuestionAttempt

Ví dụ tối thiểu:

```json
{
  "attemptId": "attempt-001",
  "position": 1,
  "questionId": "jpd123-q-0101",
  "questionVersion": 2,
  "examItemId": null,
  "optionOrder": [
    "option-c",
    "option-a",
    "option-d",
    "option-b"
  ],
  "selectedOptionIds": [],
  "answerState": "unanswered",
  "isCorrect": null,
  "reviewState": "needs_review",
  "lockedAt": null,
  "answeredAt": null
}
```

Phải lưu `optionId`, không chỉ lưu vị trí A/B/C/D, vì vị trí có thể thay đổi
khi trộn đáp án.

## 5. Trạng thái thao tác và trạng thái ôn tập

Hệ thống giữ hai khái niệm riêng:

### `answerState`

Ghi đúng hành động trong lượt:

| Giá trị | Ý nghĩa |
| --- | --- |
| `unanswered` | Chưa chọn đáp án hoặc để trống khi nộp |
| `incorrect` | Đã trả lời nhưng không đúng |
| `correct` | Đã trả lời đúng |

`unanswered` vẫn cần tồn tại để app biết câu nào chưa làm, hỗ trợ tiếp tục bài
dở và cảnh báo trước khi nộp.

### Quy tắc khóa trong chế độ `practice`

Ở chế độ luyện tập, thao tác chọn đáp án chính là thao tác trả lời:

1. Người học chọn một đáp án.
2. App ghi nhận lựa chọn đầu tiên, chấm và tự động lưu.
3. `answerState`, `isCorrect`, `answeredAt` và `lockedAt` được thiết lập.
4. Câu bị khóa ngay; không được đổi, bỏ chọn hoặc chọn lại đáp án trong cùng
   session.
5. App hiển thị đúng/sai, đáp án đúng và lời giải nếu có.
6. App giữ nguyên câu hiện tại cho đến khi người học bấm **Tiếp tục**.
7. Chỉ sau thao tác **Tiếp tục**, app mới chuyển sang câu kế tiếp.

Không có bước **Xác nhận đáp án** riêng và app không tự chuyển câu sau khi chấm.
Nếu muốn trả lời lại câu đã khóa, người học phải bắt đầu một session mới.

Quy tắc khóa ngay không áp dụng cho `mode: "exam"`: người học vẫn có thể sửa
lựa chọn trong đề cho đến khi bấm **Nộp bài**.

### `reviewState`

Ghi cách câu được xử lý trong hệ thống ôn tập:

```text
correct                 → mastered_for_attempt
incorrect + unanswered  → needs_review
```

Quy tắc đã chốt:

> Trong thống kê kiến thức, mọi câu không đúng — gồm trả lời sai và không trả
> lời — đều được xem là cần ôn lại. Không tạo một nhóm ôn tập riêng cho câu bỏ
> trống.

Một session đang `in_progress` không được kết luận vĩnh viễn rằng câu
`unanswered` cần ôn. Việc quy đổi cuối cùng được thực hiện khi session
`completed` hoặc `abandoned`. Trong lúc đang làm, app vẫn có thể hiển thị tạm
thời các câu chưa trả lời.

## 6. Chấm điểm

Kết quả chính luôn tính trên toàn bộ số câu trong lượt:

```text
scorePercent = correctCount / totalQuestionCount × 100
needsReviewCount = incorrectCount + unansweredCount
```

Ví dụ:

```text
Tổng: 50
Đúng: 38
Sai: 5
Không trả lời: 7

Điểm chính: 38/50 = 76%
Cần ôn lại: 12 câu
```

App có thể hiển thị số câu chưa trả lời để người dùng hiểu kết quả, nhưng không
dùng tỷ lệ đúng trên số câu đã trả lời làm điểm chính vì tỷ lệ đó có thể làm
kết quả cao giả tạo.

## 7. Nộp bài và lưu dữ liệu

- Trong `practice`, lựa chọn đầu tiên phải được lưu và khóa bằng một thao tác
  nguyên tử; các thao tác sửa đáp án sau đó phải bị từ chối.
- Bấm **Tiếp tục** cập nhật vị trí hiện tại và phải được tự động lưu.
- Trong `exam`, mọi thay đổi đáp án trước khi nộp và vị trí hiện tại phải được
  tự động lưu.
- Người dùng có thể nộp khi còn câu chưa trả lời sau một cảnh báo rõ ràng.
- Khi nộp, câu chưa trả lời giữ `answerState: "unanswered"` và được quy về
  `reviewState: "needs_review"`.
- Session `completed` không được sửa. Muốn làm lại phải tạo session mới.
- Session không tự hoàn thành chỉ vì người dùng không mở app trong thời gian
  dài.

## 8. Phiên bản và lịch sử

- Mỗi attempt lưu `questionVersion` đã dùng.
- Lượt mới dùng phiên bản câu hỏi hiện hành.
- Lượt cũ không được tính lại kết quả khi câu hỏi được sửa.
- Không xóa cứng phiên bản câu hỏi đã được một session tham chiếu.
- Một câu xuất hiện ở hai vị trí của đề phải tạo hai `QuestionAttempt` riêng.

## 9. Quy tắc hiển thị và trộn

- Luyện ngân hàng mặc định trộn câu và xem đáp án sau khi trả lời.
- Làm đề cũ mặc định giữ thứ tự nguồn và chỉ xem đáp án sau khi nộp.
- Nếu trộn đáp án, `optionOrder` phải được lưu cố định trong attempt.
- Mở lại session phải hiển thị đúng thứ tự đã tạo ban đầu.

Các mặc định này có thể được người dùng thay đổi trước khi bắt đầu session.

## 10. Validation tối thiểu

Lỗi mức `error` gồm:

- trùng `sessionId`, `attemptId` hoặc `position`;
- `mode` không hợp lệ;
- Subject, Exam, ExamItem, Question hoặc phiên bản không tồn tại;
- câu hỏi thuộc sai Subject;
- đáp án đã chọn không thuộc câu hỏi;
- `isCorrect`, `answerState` và đáp án đã chọn mâu thuẫn;
- attempt đã trả lời trong `practice` nhưng thiếu `lockedAt`;
- attempt đã khóa nhưng lựa chọn hoặc kết quả tiếp tục bị sửa;
- `reviewState` không đúng theo quy tắc quy đổi;
- session `completed` thiếu `completedAt`;
- session `in_progress` lại có `completedAt`;
- attempt trong chế độ Exam tham chiếu ExamItem không thuộc Exam nguồn.

Cảnh báo gồm:

- nộp khi còn câu chưa trả lời;
- nhiều session đang làm dở cùng nguồn;
- số câu thực tế thấp hơn số lượng yêu cầu;
- một câu lặp trong session luyện ngân hàng.

## 11. Quyết định còn mở

Contract chưa được xem là chốt toàn bộ cho đến khi quyết định:

- Có cho chỉnh cài đặt hiển thị sau khi session đã bắt đầu không?

Thuật toán ưu tiên câu cần ôn, khoảng cách lặp lại và cân bằng câu mới/cũ thuộc
`Progress & Review Algorithm`, không thuộc Contract này.
