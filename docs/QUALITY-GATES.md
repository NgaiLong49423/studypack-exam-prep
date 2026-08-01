# Quality Gates

## Content gate tự động

- Chạy `node scripts/validate-content.mjs` trước khi chạy Frontend CI hoặc build
  GitHub Pages.
- Sau build, chạy `node scripts/verify-deploy-artifact.mjs`; mọi file trong
  `app/dist/subjects/` phải khớp byte-for-byte với `subjects/` trước khi Pages
  được upload.
- Build Pages phải đặt `VITE_CONTENT_REVISION` theo commit deploy để URL fetch
  catalog/nội dung thay đổi ở mỗi bản phát hành và không dùng cache cũ.
- Sửa mọi `ERROR` do validator báo trước khi chuyển môn sang `published` hoặc
  mở Pull Request. `warning` cần được xem xét nhưng không chặn build.

## Trước khi dựng giao diện

- Chốt Question Contract.
- Chốt Subject Contract.
- Chốt Topic Contract.
- Tạo dữ liệu mẫu JPD123 và CSD201.
- Kiểm chứng tên thư mục môn khớp `subjectId`.
- Kiểm chứng `draft` và `archived` không tạo lượt học mới.
- Kiểm chứng môn `archived` vẫn đọc được lịch sử.
- Kiểm chứng môn không có câu hỏi hợp lệ không thể chuyển sang `published`.
- Kiểm chứng bản cấu hình có `error` không ghi đè bản hợp lệ.
- Kiểm chứng câu dùng lại giữa nhiều đề.
- Kiểm chứng gộp câu không làm giảm tổng số ExamItem hoặc số câu trong từng khu vực.
- Kiểm chứng đề 50 câu vẫn xuất đủ 50 câu sau khi gộp.
- Kiểm chứng Random All không bỏ câu trong đề cũ.
- Kiểm chứng Markdown xuất cho Gemini Notebook tìm được câu theo ID.
- Kiểm chứng xuất ngân hàng và câu yếu chỉ có một bản cho mỗi question ID.
- Kiểm chứng mọi câu Practice chỉ khóa sau khi người học xác nhận tập lựa
  chọn, và lựa chọn tạm thời được đánh dấu rõ trước khi xác nhận.
- Kiểm chứng không thể đổi, bỏ chọn hoặc chọn lại đáp án sau khi câu đã khóa.
- Kiểm chứng app không tự chuyển câu sau khi chấm và chỉ chuyển khi người học
  bấm **Tiếp tục**.
- Kiểm chứng thi thử không lộ đáp án trước khi nộp bài.
- Kiểm chứng mọi Subject `published` có AI Tutor bật với prompt template hợp lệ;
  validator phải chặn publish nếu thiếu hoặc tắt cấu hình này.
- Kiểm chứng **Hỏi AI** chỉ bật sau khi kết quả được ghi nhận.
- Kiểm chứng prompt chứa đúng câu, lựa chọn chính thức, đáp án đúng và không chứa
  lựa chọn của người học hoặc dữ liệu thừa.
- Kiểm chứng prompt vẫn được sao chép khi trình duyệt chặn mở Gemini Notebook.
- Kiểm chứng người học chưa lưu URL Notebook vẫn sao chép được prompt.
- Kiểm chứng URL Notebook chỉ lưu local theo `subjectId`, chỉ chấp nhận HTTPS
  và không xuất hiện trong JSON hoặc Gemini Pack.
- Kiểm chứng câu có dưới 4 kết quả vẫn dùng tần suất mặc định.
- Kiểm chứng từ kết quả thứ 4, tỷ lệ đúng được tính trên toàn bộ lịch sử.
- Kiểm chứng kết quả thứ 5 trở đi tiếp tục làm thay đổi tỷ lệ tích lũy, không chỉ
  lấy 4 kết quả gần nhất.
- Kiểm chứng đúng các biên 25%, 50%, 75% và 90%.
- Kiểm chứng câu có tỷ lệ đúng từ 90–100% vẫn có xác suất xuất hiện lớn hơn 0.
- Kiểm chứng lượt luyện phân bổ mục tiêu theo năm nhóm
  `35% – 25% – 20% – 12% – 8%`.
- Kiểm chứng câu có 0–3 kết quả được xếp tạm vào nhóm Bình thường và câu có ít
  kết quả hơn được ưu tiên trước.
- Kiểm chứng một `questionId` không xuất hiện hai lần trong cùng một lượt luyện.
- Kiểm chứng khi một nhóm thiếu câu, vị trí còn thiếu được chuyển sang nhóm gần
  nhất mà không chọn lại câu đã có.
- Kiểm chứng khi toàn ngân hàng không đủ câu duy nhất, lượt luyện giảm kích
  thước và thông báo số câu thực tế thay vì lặp câu.
- Kiểm chứng kết quả mới chỉ đổi nhóm cho lượt tiếp theo, không thay danh sách
  câu của lượt đang làm.
- Kiểm chứng thuật toán tần suất không thay đổi `ExamItem`, thứ tự hoặc khu vực
  của đề thi có sẵn.
- Kiểm chứng thống kê được gộp theo `questionId` nhưng vẫn giữ `examId` và
  `examItemId` trong từng kết quả.
- Kiểm chứng xóa lịch sử khiến tỷ lệ và mức tần suất được tính lại.
- Kiểm chứng `error` chặn nhập, xuất bản và xuất Markdown.
- Kiểm chứng chỉ có `warning` vẫn cho xuất Markdown sau khi người dùng xác nhận.
- Kiểm chứng issue có mã lỗi ổn định và trỏ đúng đến `field` bị sai.
- Kiểm chứng Question thiếu đáp án đúng hoặc tham chiếu đáp án không tồn tại bị
  chặn.
- Kiểm chứng thiếu lời giải chỉ cảnh báo và hiển thị **Chưa có lời giải**.
- Kiểm chứng `EXACT_DUPLICATE` tự dùng lại Question hiện có.
- Kiểm chứng `POSSIBLE_DUPLICATE` chỉ cảnh báo và không tự gộp.
- Kiểm chứng nhập đề tạo đủ ExamItem theo vị trí nguồn sau khi chống trùng.
- Kiểm chứng đường dẫn asset là tương đối, không dùng `../`, tệp tồn tại và
  không xung đột chữ hoa/chữ thường.
- Kiểm chứng Exam chỉ được xuất bản khi mọi tham chiếu hợp lệ và số ExamItem
  khớp số lượng khai báo.
- Kiểm chứng câu lặp hợp lệ trong đề không bị validator xóa hoặc gộp vị trí.
- Kiểm chứng tài nguyên không còn được dùng chỉ tạo cảnh báo và không tự bị xóa.
- Kiểm chứng bản chỉnh sửa có `error` được giữ ở `draft`, không ghi đè phiên bản
  hợp lệ đang có lịch sử hoặc được ExamItem tham chiếu.
- Kiểm chứng báo cáo tổng hợp đúng số `error`, `warning`, `info` và `valid`.
- Kiểm chứng thiếu `topics.json` không chặn môn hoặc Question được phát hành.
- Kiểm chứng `topicIds` bị thiếu, là `null` hoặc `[]` đều được chuẩn hóa thành
  `[]` và chỉ tạo `QUESTION_HAS_NO_TOPIC` ở mức `info`.
- Kiểm chứng câu chưa phân loại vẫn xuất hiện trong Random All, Exam và Markdown.
- Kiểm chứng luyện theo Topic bỏ qua câu chưa phân loại, loại trùng theo
  `questionId` rồi mới áp dụng phân bổ `35% – 25% – 20% – 12% – 8%`.
- Kiểm chứng một Exam không bị lưu hoặc xử lý như Topic.
- Kiểm chứng Topic cha không tồn tại, sai môn hoặc tạo vòng lặp bị chặn.
- Kiểm chứng `Question.topicIds` tham chiếu Topic không tồn tại hoặc sai môn bị
  chặn.
