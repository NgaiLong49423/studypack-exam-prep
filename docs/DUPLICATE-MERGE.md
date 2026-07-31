# Duplicate Detection and Merge

Status: Accepted

## Quy trình

```text
Nhập dữ liệu → tìm ứng viên trùng
├── trùng chắc chắn → tự dùng lại questionId
├── nghi trùng → người dùng xác nhận
└── câu mới → tạo Question
```

- Chỉ tìm câu trùng trong cùng môn.
- Chỉ tự dùng lại Question khi kết quả là `EXACT_DUPLICATE`.
- Với `POSSIBLE_DUPLICATE`, người dùng chọn **Gộp**, **Giữ riêng** hoặc **Bỏ qua**.
- Exam giữ trạng thái draft cho đến khi các trường hợp nghi trùng được xử lý.

## Mức phát hiện

- `EXACT_DUPLICATE`: nội dung, tập lựa chọn, đáp án đúng sau ánh xạ,
  `maxSelections` và tài nguyên cần thiết tương đương sau chuẩn hóa an toàn.
- `POSSIBLE_DUPLICATE`: gần giống nhưng khác biệt vẫn có thể ảnh hưởng ý nghĩa
  hoặc cách trả lời.
- `NEW_QUESTION`: không có ứng viên đủ giống.

Chuẩn hóa chỉ phục vụ so sánh; không âm thầm sửa dữ liệu nguồn.

## Không gộp khi

- Khác nội dung ảnh hưởng đến cách trả lời.
- Khác danh sách lựa chọn. Riêng việc đảo thứ tự lựa chọn vẫn có thể là trùng
  nếu ánh xạ đáp án đúng cho kết quả tương đương.
- Khác đáp án đúng.
- Khác `maxSelections`.
- Khác hình ảnh, bảng hoặc code cần dùng để trả lời.

## Khi gộp

- Giữ `questionId` của câu đã tồn tại.
- Đổi `questionId` trên các `ExamItem` của câu mới sang ID được giữ.
- Không xóa, di chuyển hoặc đánh lại số `ExamItem`.
- Giữ lời giải đang có; không để dữ liệu rỗng ghi đè lời giải.
- Lưu lịch sử gộp để có thể kiểm tra.

`EXACT_DUPLICATE` là dùng lại Question hiện có, không phải xóa một Question đã
phát hành. Mọi ExamItem của đề mới vẫn phải được tạo đủ.
