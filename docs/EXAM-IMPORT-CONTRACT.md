# Exam Import Contract

Status: Accepted

## Nguyên tắc

Ngân hàng `Question` là nguồn dữ liệu gốc. Nạp một đề không yêu cầu mọi câu đã
có sẵn; quy trình nhập sẽ đối chiếu, bổ sung câu mới rồi tạo `ExamItem`.

```text
Nạp đề
→ tách và chuẩn hóa từng câu để so sánh
→ đối chiếu ngân hàng cùng môn
→ dùng lại câu trùng / chờ duyệt câu nghi trùng / thêm câu mới
→ tạo ExamItem theo đúng vị trí nguồn
```

## Trình tự bắt buộc

1. Đọc metadata (thông tin mô tả), Section và từng câu theo đúng thứ tự nguồn.
2. Tạo bản nhập tạm; chưa ghi Exam published.
3. Chuẩn hóa bản sao dữ liệu chỉ để so sánh, không âm thầm sửa nội dung nguồn.
4. So sánh từng câu với Question trong cùng Subject.
5. Phân loại kết quả chống trùng.
6. Giải quyết toàn bộ trường hợp nghi trùng.
7. Tạo Question mới cho câu không trùng.
8. Tạo ExamItem tham chiếu Question và phiên bản tương ứng.
9. Chạy Validation trước khi chuyển Exam sang published.

## Ba kết quả chống trùng

### `EXACT_DUPLICATE`

Trùng chắc chắn khi nội dung, tập đáp án, đáp án đúng, số lựa chọn tối đa và tài
nguyên cần thiết tương đương sau chuẩn hóa an toàn. Thứ tự đáp án có thể khác
nếu ánh xạ đáp án đúng vẫn tương đương.

- Tự dùng lại `questionId` đã tồn tại.
- Không tạo Question mới.
- Vẫn tạo ExamItem mới để giữ vị trí trong đề vừa nhập.
- Ghi lịch sử quyết định và dữ liệu so sánh.

### `POSSIBLE_DUPLICATE`

Nội dung có vẻ tương đương nhưng còn khác biệt có thể ảnh hưởng ý nghĩa.

- Không tự gộp.
- Đưa vào hàng chờ để người dùng chọn `merge`, `keepSeparate` hoặc `skip`.
- Exam chỉ ở trạng thái draft khi còn trường hợp chưa giải quyết.

### `NEW_QUESTION`

Không tìm thấy ứng viên đủ giống.

- Tạo Question mới trong ngân hàng.
- Gán ID ổn định theo quy tắc của Subject.
- Tạo ExamItem tham chiếu Question mới.

## Phạm vi so sánh

Chỉ so sánh trong cùng Subject và xem xét:

- Nội dung câu hỏi sau chuẩn hóa.
- Danh sách đáp án; có thể đối chiếu không phụ thuộc thứ tự.
- Đáp án đúng sau khi ánh xạ lại thứ tự.
- `maxSelections`.
- Ảnh, bảng, code hoặc tài nguyên cần để trả lời.

Không coi là trùng chắc chắn nếu khác biệt làm thay đổi cách hiểu hoặc cách trả
lời. Agent chỉ hỗ trợ phát hiện; không tự gộp trường hợp mơ hồ.

## Tính nguyên tử

Import phải thất bại an toàn:

- Không để lại Exam published một phần.
- Không để ExamItem tham chiếu Question chưa tồn tại.
- Không ghi đè Question hợp lệ bằng dữ liệu nhập lỗi hoặc rỗng.
- Có thể tiếp tục từ bản draft sau khi người dùng xử lý hàng chờ.

## Báo cáo nhập

```json
{
  "examId": "jpd123-sp26-c2-fe",
  "sourceItemCount": 50,
  "exactDuplicateCount": 30,
  "possibleDuplicateCount": 5,
  "newQuestionCount": 15,
  "createdExamItemCount": 50,
  "status": "needs-review"
}
```

`createdExamItemCount` phải bằng số vị trí đã nhập thành công, không phải số
Question duy nhất.

## Validation

`error`:

- ExamItem được tạo mà không có Question hợp lệ.
- Question hoặc ExamItem bị gán sai Subject.
- Tự gộp một `POSSIBLE_DUPLICATE`.
- Import làm mất, đổi thứ tự hoặc nhân bản ngoài ý muốn vị trí nguồn.
- Ghi đè dữ liệu ngân hàng bằng trường rỗng hoặc dữ liệu không hợp lệ.

`warning`:

- Còn câu nghi trùng chờ xác nhận.
- Số câu đọc được khác số câu nguồn khai báo.
- Một Question được dùng tại nhiều vị trí trong cùng Exam.

`info`:

- Câu mới chưa có Topic.
- Câu trùng chắc chắn đã tự dùng lại Question hiện có.
