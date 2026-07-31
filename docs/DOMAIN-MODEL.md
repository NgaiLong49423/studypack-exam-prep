# Domain Model

Status: Draft

Các thực thể dự kiến:

- Subject
- Question
- Exam
- ExamSection
- ExamItem
- PracticeSession
- QuestionAttempt
- QuestionProgress
- NotebookExport
- AiTutorPrompt
- DuplicateCandidate
- MergeHistory
- Topic

`Topic` là thực thể phân loại tùy chọn. Môn và Question không bắt buộc phải có
Topic; Question chưa phân loại vẫn được phát hành và chỉ nhận issue mức `info`.
`Exam` không phải Topic và vẫn liên kết Question qua `ExamItem`.

`Exam` thuộc một Subject và chứa các ExamItem theo đúng vị trí nguồn. Mỗi
ExamItem tham chiếu một Question cùng Subject và phiên bản Question cụ thể.
Nhập Exam có thể bổ sung Question mới vào ngân hàng; nội dung Question không
được lưu lặp trong ExamItem.

`difficulty` không thuộc mô hình bắt buộc. Tên khu vực nếu có nằm ở
`ExamSection` và được giữ nguyên từ dữ liệu nguồn.

Mọi lượt luyện và làm đề cũ đều dùng `PracticeSession`; không tạo
`ExamAttempt` riêng. Mỗi vị trí trong lượt là một `QuestionAttempt`. Dữ liệu
phân biệt `incorrect` và `unanswered`, nhưng cả hai cùng quy về
`needs_review` khi tính nhu cầu ôn tập.
