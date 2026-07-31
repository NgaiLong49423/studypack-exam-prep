# Subject Contract

Status: Accepted

Tài liệu này định nghĩa cấu hình và vòng đời của một môn học. Mỗi môn là một
gói dữ liệu độc lập trong `subjects/{subjectId}/`.

## 1. Tệp cấu hình bắt buộc

Mỗi môn phải có `subjects/{subjectId}/subject.json` với cấu trúc:

```json
{
  "schemaVersion": "1.0",
  "subjectId": "jpd123",
  "code": "JPD123",
  "name": "Japanese Elementary 3",
  "description": "Ngân hàng lý thuyết và câu hỏi ôn tập JPD123.",
  "status": "published",
  "contentLanguages": ["ja", "vi"],
  "explanationLanguage": "vi",
  "aiTutor": {
    "enabled": true,
    "provider": "gemini-notebook",
    "promptTemplateId": "explain-question-v1"
  }
}
```

## Danh mục môn học

`subjects/index.json` là danh mục versioned để app hiển thị và tải môn theo
`subjectId`. Mỗi entry có `subjectId`, thông tin hiển thị, `status` và `examIds`.

- `published`: entry phải có ngân hàng Question hợp lệ; app cho phép bắt đầu ôn.
- `draft`: app chỉ hiển thị trạng thái đang chuẩn bị, không tải Question hoặc
  tạo lượt học.
- `examIds`: danh sách ID đề của Subject để loader tải chính xác file Exam; không
  được suy đoán bằng cách quét thư mục trên GitHub Pages.

## Quy trình thêm môn và đề mới

1. Tạo scaffold `subjects/{subjectId}/` và thêm Subject ở trạng thái `draft` vào
   `subjects/index.json`.
2. Nhập Question và Exam theo `EXAM-IMPORT-CONTRACT.md`; không tạo dữ liệu giả.
3. Chạy validation, xử lý câu nghi trùng và kiểm tra mọi ExamItem tham chiếu.
4. Khi ngân hàng hợp lệ, thêm `examIds` đã publish và đổi Subject sang `published`.
5. App tự hiển thị môn để ôn; lịch sử localStorage được tách theo `subjectId`.

## 2. Danh tính môn học

| Trường | Bắt buộc | Quy tắc |
|---|---:|---|
| `schemaVersion` | Có | Phiên bản cấu trúc dữ liệu |
| `subjectId` | Có | Mã nội bộ duy nhất, viết thường |
| `code` | Có | Mã hiển thị chính thức |
| `name` | Có | Tên đầy đủ của môn |
| `description` | Không | Mô tả ngắn |

`subjectId` phải khớp `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Tên thư mục phải khớp
chính xác với `subjectId`.

Sau khi môn có câu hỏi hoặc lịch sử học, không được sửa trực tiếp `subjectId`.
Việc đổi ID phải dùng quy trình di chuyển dữ liệu để cập nhật toàn bộ tham
chiếu.

## 3. Trạng thái

| Trạng thái | Quy tắc |
|---|---|
| `draft` | Đang biên tập; không hiện trong danh sách học thông thường |
| `published` | Được phép tạo lượt luyện và thi thử |
| `archived` | Giữ lịch sử nhưng không tạo lượt học mới |

Chuyển sang `archived` phải xác nhận. Việc lưu trữ không tự động xóa câu hỏi,
đề thi hoặc lịch sử.

## 4. Ngôn ngữ

- `contentLanguages`: các ngôn ngữ có thể xuất hiện trong câu hỏi và lý thuyết.
- `explanationLanguage`: ngôn ngữ mặc định của lời giải và prompt Hỏi AI.
- Đây là cấu hình mặc định; từng câu vẫn có thể khai báo ngôn ngữ riêng.

## 5. Cấu hình Hỏi AI

- `enabled: false`: không hiển thị nút Hỏi AI.
- `enabled: true`: cho phép tạo và sao chép prompt.
- URL Gemini Notebook không thuộc `subject.json`; mỗi người học tự lưu URL
  HTTPS riêng theo `subjectId` trong localStorage của trình duyệt.
- Sau khi người học lưu link riêng, app sao chép prompt rồi mở link đó.
- Nếu chưa lưu link, app vẫn sao chép prompt; người dùng tự mở Gemini.
- Ứng dụng không gọi Gemini API.
- `promptTemplateId` phải tham chiếu mẫu prompt tồn tại; thiếu mẫu là `error`.
- URL không hợp lệ là `warning`; vẫn được sao chép prompt.

## 6. Cấu trúc thư mục

```text
subjects/{subjectId}/
├── subject.json
├── questions/
├── theory/
├── exams/
├── assets/
└── notebook/
```

`subject.json` là bắt buộc. Những thư mục còn lại có thể chưa có dữ liệu khi môn
đang ở trạng thái `draft`.

## 7. Phạm vi dữ liệu

- `Question`, `Exam`, `Topic` và lịch sử học phải lưu đúng `subjectId`.
- Tài nguyên của môn này không tham chiếu trực tiếp sang thư mục môn khác.
- Ở phiên bản đầu, tài nguyên dùng chung được sao chép vào từng môn.

## 8. Điều kiện xuất bản

Một môn chỉ được chuyển sang `published` khi:

- `subjectId`, `code`, `name` hợp lệ.
- Tên thư mục khớp `subjectId`.
- Không còn lỗi mức `error`.
- Có ít nhất một câu hỏi hợp lệ.
- Tất cả câu hỏi tham chiếu đúng môn.
- Cấu hình Hỏi AI hợp lệ nếu được bật.

Không bắt buộc có đề thi, lý thuyết hoặc lời giải đầy đủ.

## 9. Chỉnh sửa an toàn

- Có thể cập nhật `name`, `description` và ngôn ngữ.
- Không lưu URL Gemini Notebook trong dữ liệu Subject dùng chung.
- Thay đổi cấu hình không được sửa lịch sử đã lưu.
- Nếu bản chỉnh sửa có `error`, giữ bản hợp lệ hiện tại và lưu thay đổi thành
  `draft`.

## 10. Điều kiện kiểm thử

- Chấp nhận `subjectId` hợp lệ và từ chối ID có chữ hoa, khoảng trắng hoặc `..`.
- Phát hiện tên thư mục không khớp `subjectId`.
- Không cho `draft` và `archived` tạo lượt học mới.
- Vẫn đọc được lịch sử của môn `archived`.
- Chặn xuất bản môn không có câu hỏi hợp lệ.
- Chặn Hỏi AI khi thiếu `promptTemplateId` hợp lệ.
- Kiểm tra URL HTTPS local trước khi lưu; thiếu link vẫn cho sao chép prompt.
- Không ghi đè cấu hình hợp lệ bằng một bản chỉnh sửa có `error`.

