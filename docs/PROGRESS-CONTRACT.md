# Progress Contract

Status: Accepted

Tài liệu này quy định cách lưu lịch sử làm bài, tính tỷ lệ đúng tích lũy và điều
chỉnh tần suất xuất hiện của từng câu hỏi.

## 1. Lịch sử là dữ liệu gốc

- Mỗi lượt luyện tập hoặc thi thử có một `attemptId` riêng.
- Kết quả mới được thêm vào lịch sử; không ghi đè kết quả cũ.
- Luyện tập ghi nhận và khóa ngay khi người dùng chọn đáp án lần đầu.
- Thi thử có thể tự lưu lựa chọn tạm thời, nhưng chỉ đưa kết quả vào thống kê sau
  khi người dùng bấm **Nộp bài**.
- Bài thi thử chưa nộp không ảnh hưởng tỷ lệ đúng hoặc tần suất xuất hiện.
- Trong bài thi thử đã nộp, câu bỏ trống có kết quả `unanswered`.

Kết quả từng câu chỉ có ba trạng thái:

```text
correct
incorrect
unanswered
```

Mỗi kết quả giữ `questionId`. Nếu câu đến từ một đề cụ thể, kết quả đồng thời giữ
`examId` và `examItemId` để truy lại nơi câu đã xuất hiện.

## 2. Thống kê theo Question

Nếu cùng một `questionId` xuất hiện ở nhiều đề hoặc nhiều vị trí, tất cả kết quả
đã ghi nhận vẫn đóng góp vào một lịch sử chung của câu hỏi đó.

```json
{
  "questionId": "jpd123-q-0042",
  "attemptCount": 5,
  "correctCount": 3,
  "incorrectCount": 1,
  "unansweredCount": 1,
  "correctRate": 60,
  "frequencyBand": "normal"
}
```

Các số tổng hợp được tính lại từ lịch sử và không phải dữ liệu gốc.

```text
attemptCount = correctCount + incorrectCount + unansweredCount
correctRate = correctCount / attemptCount × 100
```

Tỷ lệ được tính trên toàn bộ lịch sử đã ghi nhận, không chỉ lấy bốn kết quả gần
nhất. Kết quả thứ năm, thứ sáu và mọi kết quả sau đó đều tiếp tục làm thay đổi tỷ
lệ tích lũy.

## 3. Điều kiện bắt đầu phân mức

- Khi `attemptCount < 4`, câu hỏi dùng tần suất mặc định.
- Khi `attemptCount >= 4`, ứng dụng bắt đầu phân mức theo `correctRate`.
- Sau mỗi kết quả mới, ứng dụng tính lại tỷ lệ và mức tần suất.

Bốn lần đầu vẫn được lưu và tham gia công thức; chúng không bị bỏ đi khi bắt đầu
phân mức.

## 4. Các mức tần suất

| Tỷ lệ đúng tích lũy | Mức tần suất |
|---:|---|
| 0–25% | Rất thường xuyên |
| Trên 25–50% | Thường xuyên |
| Trên 50–75% | Bình thường |
| Trên 75–dưới 90% | Ít |
| 90–100% | Ít nhất |

Quy tắc bắt buộc:

- Tỷ lệ đúng càng thấp thì câu có ưu tiên xuất hiện càng cao.
- Câu ở mức 90–100% vẫn có khả năng xuất hiện.
- Trọng số hoặc xác suất của mọi câu active phải lớn hơn `0`.
- Không tồn tại trạng thái nhị phân `needsReview`.
- Một lần bấm nhầm chỉ là một dữ liệu trong lịch sử, không tự chuyển câu sang
  trạng thái bắt buộc ôn lại.
- Thuật toán phân bổ câu theo năm mức được quy định tại mục 5.

## 5. Thuật toán chọn câu luyện tập

Thuật toán này áp dụng khi tạo một lượt luyện tập ngẫu nhiên từ ngân hàng câu
hỏi. Ứng dụng phân bổ số vị trí theo nhóm trước, sau đó mới chọn câu trong từng
nhóm.

| Tỷ lệ đúng tích lũy | Mức tần suất | Tỷ lệ mục tiêu trong lượt |
|---:|---|---:|
| 0–25% | Rất thường xuyên | 35% |
| Trên 25–50% | Thường xuyên | 25% |
| Trên 50–75% | Bình thường | 20% |
| Trên 75–dưới 90% | Ít | 12% |
| 90–100% | Ít nhất | 8% |

Các tỷ lệ trên là mục tiêu phân bổ cho cả lượt, không phải xác suất độc lập của
từng câu. Khi làm tròn số lượng câu, ứng dụng phải giữ tổng số vị trí bằng kích
thước lượt người dùng yêu cầu, nếu ngân hàng còn đủ câu phù hợp.

### 5.1. Câu chưa đủ bốn kết quả

- Câu có `attemptCount` từ 0 đến 3 tạm tham gia nhóm **Bình thường**.
- Trong nhóm này, ưu tiên câu có `attemptCount` thấp hơn.
- Vì vậy thứ tự ưu tiên là: chưa từng làm, đã làm một lần, hai lần rồi ba lần.
- Sau khi đủ bốn kết quả, câu được phân nhóm bằng `correctRate` tích lũy.

### 5.2. Không lặp trong cùng một lượt

- Việc chọn câu dùng `questionId`, không dùng `ExamItem`.
- Một `questionId` chỉ được xuất hiện tối đa một lần trong cùng một lượt luyện.
- Câu đã chọn bị loại khỏi tập ứng viên của lượt hiện tại, nhưng có thể xuất hiện
  lại ở lượt sau.
- Nếu toàn ngân hàng có ít câu duy nhất hơn số lượng yêu cầu, ứng dụng tạo lượt
  với số câu tối đa đang có và thông báo số câu thực tế; không lặp câu để lấp chỗ.

### 5.3. Khi một nhóm không đủ câu

- Lấy tất cả câu còn lại của nhóm đó.
- Phân phối số vị trí thiếu sang nhóm có mức tần suất gần nhất.
- Ưu tiên nhóm gần nhất theo hướng có `correctRate` cao hơn; nếu vẫn thiếu thì
  tiếp tục sang nhóm kế tiếp.
- Nếu không còn đủ ở hướng cao hơn, tiếp tục lấy từ nhóm gần nhất theo hướng
  thấp hơn.
- Không chọn lại câu đã có trong lượt.

Tỷ lệ mục tiêu có thể lệch khi số câu của một nhóm không đủ, nhưng ứng dụng vẫn
phải cố gắng tạo đủ kích thước lượt từ toàn bộ tập ứng viên.

### 5.4. Thời điểm tính lại

- Sau mỗi lần **Xác nhận**, kết quả được thêm vào lịch sử và thống kê của câu
  được tính lại.
- Nhóm mới chỉ ảnh hưởng từ lượt luyện tiếp theo.
- Không thay đổi hoặc thay thế danh sách câu đã được tạo cho lượt đang làm.

### 5.5. Phạm vi không áp dụng

Thuật toán phân bổ này không được dùng cho đề thi cũ, thi thử theo đề có sẵn
hoặc xem lại lịch sử. Các luồng theo đề phải giữ nguyên mọi `ExamItem`, thứ tự và
khu vực của đề.

## 6. Xóa lịch sử

- Có thể xóa một lượt làm cụ thể hoặc toàn bộ lịch sử của một môn.
- Phải yêu cầu xác nhận trước khi xóa.
- Sau khi xóa, mọi thống kê và mức tần suất liên quan phải được tính lại từ lịch
  sử còn lại.

## 7. Bất biến dữ liệu

- Không được sửa hoặc xóa kết quả cũ chỉ để làm đẹp tỷ lệ.
- Không được dùng `ExamItem` làm khóa thống kê năng lực của câu.
- Không được loại vĩnh viễn câu active chỉ vì `correctRate` đạt 100%.
- Không được phân mức khi câu chưa đủ bốn kết quả đã ghi nhận.
- Không được lặp `questionId` để lấp đủ số lượng trong cùng một lượt luyện.
- Không được dùng thuật toán tần suất để thay đổi cấu trúc của một đề có sẵn.
