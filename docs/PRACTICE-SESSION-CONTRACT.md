# Practice Session Contract

Status: Partially accepted

Phạm vi đã triển khai trong V1 là session luyện từ question bank (`practice`),
bao gồm lưu và khôi phục một lượt đang làm dở trên cùng trình duyệt. Các phần
về session Exam đầy đủ, bỏ lượt có trạng thái riêng và tiếp tục nhiều session
vẫn là định hướng cho phase sau.

## 1. Phạm vi và mô hình hiện tại

Một `PracticeSession` đại diện cho một lượt luyện câu hỏi của một Subject.
Danh sách câu được cố định ngay khi bắt đầu lượt. Session được lưu cục bộ bằng
`localStorage`, tách theo `subjectId`:

```text
studypack:{subjectId}:practice-session:v1
```

Session hiện tại lưu:

```json
{
  "sessionId": "practice-jpd123-...",
  "subjectId": "jpd123",
  "mode": "smart",
  "questionRefs": [
    { "questionId": "jpd123-q-0101", "questionVersion": 1 }
  ],
  "position": 0,
  "selectedOptionIds": [],
  "isLocked": false,
  "correctCount": 0,
  "startedAt": "2026-08-01T00:00:00.000Z",
  "updatedAt": "2026-08-01T00:00:00.000Z",
  "status": "in_progress"
}
```

`AttemptRecord` vẫn là lịch sử kết quả học tập. Session đang làm dở và lịch
sử kết quả là hai dữ liệu khác nhau:

- session dùng để khôi phục thao tác hiện tại;
- attempt dùng để tính Statistics và chọn câu cho lượt sau.

V1 chưa tạo `QuestionAttempt` độc lập cho từng vị trí. Đây là mô hình mở rộng
được phép dùng ở phase sau nếu cần lưu session chi tiết hơn.

## 2. Các mode được hỗ trợ

### `smart`

Chọn câu theo lịch sử và các nhóm tần suất trong Progress Contract.

### `random`

Chọn ngẫu nhiên từ các Question đang active.

### `unseen`

Chỉ chọn câu chưa xuất hiện trong lịch sử trả lời của Subject.

### `review`

Chọn câu đã làm và có tỷ lệ đúng tích lũy không quá 50%.

Mỗi mode tạo một session mới. Việc tạo session mới không ghi đè lịch sử
`AttemptRecord` cũ.

Các mode `exam` và `custom` được mô tả trong định hướng domain nhưng chưa dùng
chung `PracticeSession` persistence trong implementation hiện tại.

## 3. Vòng đời session V1

| Trạng thái | V1 | Ý nghĩa |
| --- | --- | --- |
| `in_progress` | Đã hỗ trợ | Session đang làm hoặc đã đóng app trước khi hoàn thành |
| `completed` | Không lưu snapshot | Session bị xóa khỏi storage khi người học hoàn thành |
| `abandoned` | Chưa hỗ trợ riêng | Hiện được xử lý bằng thao tác bỏ snapshot và bắt đầu lượt khác |
| `invalidated` | Không lưu trạng thái riêng | Snapshot lỗi hoặc không khôi phục được sẽ bị xóa an toàn |

Khi người học mở lại Subject:

1. App đọc snapshot `in_progress` của Subject đó.
2. App kiểm tra toàn bộ `questionId` và `questionVersion` còn khớp question
   bank hiện tại hay không.
3. Nếu hợp lệ, app hỏi: **“Bạn có một lượt luyện đang làm dở. Bạn muốn tiếp tục
   không?”**
4. **Tiếp tục lượt đang làm** khôi phục đúng thứ tự câu, vị trí, lựa chọn tạm
   thời, trạng thái khóa và điểm hiện tại.
5. **Bắt đầu lượt mới** xóa snapshot cũ rồi chuyển tới màn hình chọn mode.
6. Nếu snapshot không hợp lệ, app xóa snapshot và không chặn việc học.

Chỉ có một snapshot Practice đang dở cho mỗi Subject trong mỗi browser storage
scope. V1 chưa hỗ trợ danh sách nhiều session đang làm dở.

## 4. Quy tắc chọn và cố định câu

- Danh sách câu được chọn một lần khi bắt đầu session.
- Thứ tự câu không thay đổi khi khôi phục.
- Mỗi reference giữ `questionId` và `questionVersion`.
- Nếu một Question bị xóa hoặc version hiện tại không còn khớp, session không
  được khôi phục một phần; toàn bộ snapshot bị loại để tránh trộn dữ liệu cũ và
  mới.
- Kết quả mới không làm thay đổi danh sách câu của session hiện tại.

## 5. Quy tắc trả lời trong Practice

### Câu một đáp án

1. Người học chọn một đáp án.
2. App chấm và ghi `AttemptRecord` ngay.
3. Lựa chọn bị khóa ngay trong session.
4. App lưu snapshot với `selectedOptionIds`, `isLocked` và `correctCount` mới.
5. Người học phải bấm **Tiếp tục** để sang câu kế tiếp.

### Câu nhiều đáp án

- Người học có thể chọn hoặc bỏ chọn trong giới hạn `maxSelections` trước khi
  xác nhận.
- Các lựa chọn tạm thời được lưu vào session để không mất khi refresh.
- Khi bấm **Xác nhận**, app chấm, lưu attempt và khóa câu.
- Sau khi khóa, không thể sửa lựa chọn trong session hiện tại.

App không tự chuyển câu sau khi chấm. Muốn trả lời lại câu đã khóa, người học
phải bắt đầu session mới.

## 6. Hoàn thành và lịch sử

- Khi người học bấm **Tiếp tục** ở câu cuối, snapshot Practice được xóa.
- Màn hình hoàn thành vẫn lấy kết quả từ state hiện tại của lượt.
- Những `AttemptRecord` đã lưu không bị xóa khi snapshot bị xóa.
- Lịch sử cũ không bị ghi đè khi bắt đầu session mới.
- Xóa snapshot không có nghĩa là xóa Statistics.

## 7. Phiên bản dữ liệu

- Session lưu `questionVersion` của từng Question tại thời điểm bắt đầu.
- Session chỉ khôi phục khi version trong question bank hiện tại khớp.
- Attempt lưu version được dùng khi trả lời.
- V1 chưa có kho lưu nhiều phiên bản Question để dựng lại nội dung cũ; khi
  version không khớp, app loại snapshot thay vì khôi phục sai nội dung.

## 8. Validation và an toàn

Snapshot không hợp lệ nếu:

- không đúng `subjectId` của storage key;
- không có `questionRefs`;
- `position` nằm ngoài danh sách câu;
- `selectedOptionIds` không phải mảng;
- `isLocked` không phải boolean;
- `correctCount` không phải số nguyên;
- status không phải `in_progress`;
- Question không tồn tại hoặc version không khớp question bank.

Snapshot lỗi không được dùng để dựng UI và không được đưa vào Statistics.

## 9. Chưa nằm trong implementation V1

- Resume session Exam với toàn bộ đáp án tạm thời của từng `ExamItem`.
- Trạng thái `abandoned` và `completed` được lưu như bản ghi session độc lập.
- Nhiều session đang làm dở cùng một Subject.
- Tiếp tục session sau khi nội dung Question đã có version mới.
- Đồng bộ session giữa nhiều thiết bị hoặc nhiều trình duyệt.
- Backend, authentication hoặc database cho learner progress.

Các mục này cần được duyệt thành issue riêng trước khi triển khai.
