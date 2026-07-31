# Gemini Export Contract

Status: Accepted

## Mục tiêu và ranh giới

StudyPack là ứng dụng ôn thi trắc nghiệm. JSON và lịch sử làm bài trong app là
nguồn dữ liệu gốc; Markdown là snapshot đọc-only để người học đưa vào Gemini
Notebook. Gemini không được cập nhật điểm, progress hoặc explanation chính
thức của app.

App không gọi Gemini API, không tự upload/xóa tài liệu trên Gemini Notebook.
Người học tự upload file export và tự thêm tài liệu lý thuyết khi cần.

## Gói Gemini

Mỗi gói thuộc một `subjectId` và một learner progress; không chứa tên, email,
account ID, raw answer log hoặc dữ liệu cá nhân.

```text
studypack-{subjectId}-{timestamp}.zip
├── STUDYPACK-GEMINI-GUIDE.md
├── subject-context.md
├── question-bank.md
├── learning-progress.md
├── exams/                  # các Exam published được người học chọn
└── assets/                 # chỉ asset được Markdown tham chiếu
```

App không export `theory/`; người học tự thêm theory Markdown vào Notebook.

Mỗi Markdown app sinh có metadata đầu file:

```text
Document type: <type>
Export format version: 1.0
Subject ID: <subjectId>
Generated at: <ISO-8601 có timezone>
Snapshot ID: <snapshotId>
```

Full pack dùng cùng `Snapshot ID` và thời điểm export. `learning-progress.md`
có thể refresh riêng sau khi người học làm bài trong app. Nếu Gemini có nhiều
bản progress, phải ưu tiên bản `Generated at` mới nhất.

## STUDYPACK-GEMINI-GUIDE.md

Guide mô tả vai trò file:

- `subject-context.md`: nhận diện môn, phạm vi, Topic và tutor rules.
- `question-bank.md`: nguồn chính thức của Question, options, đáp án và lời giải.
- `learning-progress.md`: thống kê chính thức app tính từ lịch sử hợp lệ.
- `exams/*.md`: cấu trúc và nội dung các đề đã chọn.

Khi người học yêu cầu luyện trắc nghiệm, Gemini phải:

1. Ưu tiên `not_practiced`, `weak`, `learning`, rồi `developing`.
2. Không chủ động hỏi `stable` hoặc `mastered`, trừ khi được yêu cầu hoặc cần
   làm ví dụ.
3. Chỉ hỏi một Question mỗi lượt và không lặp `questionId` trong cùng chat,
   trừ khi người học yêu cầu.
4. Dùng Question Bank làm nguồn câu hỏi/đáp án chính thức.
5. Coi kết quả chat chỉ là trao đổi học tập, không phải progress app.
6. Nếu theory do người học thêm mâu thuẫn với Question Bank, ưu tiên Question
   Bank và nói rõ có mâu thuẫn.

## subject-context.md

File chỉ lấy dữ liệu hiện có từ `subject.json`, `topics.json` (nếu có),
`notebook/subject-context.md` và `notebook/tutor-rules.md`:

- subject ID, code, name, description, languages;
- phạm vi môn;
- Topic tree nếu có;
- tutor rules.

App không tự tạo Topic, quy tắc môn hoặc nội dung theory.

## question-bank.md

Chỉ export Question hợp lệ, `active`; mỗi `questionId` đúng một lần.

```md
## Question [jpd123-q-0042]

- Current version: 1
- Topics: jpd123-grammar-lesson-15

### Source appearances

- JPD123 Spring 2026 C2 FE — Reading — Question 17

### Question content

...

### Options

1. `[opt-1]` ...
2. `[opt-2]` ...

### Correct answer

- `[opt-2]` — option 2

### Official explanation

Chưa có lời giải
```

- Câu chưa có Topic ghi `Chưa phân loại`.
- Câu chưa xuất hiện trong Exam phải ghi rõ.
- Luôn có số thứ tự hiển thị và `optionId` ổn định.
- Không tự dịch, tóm tắt, sửa nội dung hoặc sinh explanation.

## exams/{examId}.md

Chỉ export Exam `published` không có validation `error`. Markdown giữ mọi
`ExamItem`, `order`, `originalNumber`, Section và `questionVersion` tham chiếu.

```md
# Exam — JPD123 Spring 2026 C2 FE

- Exam ID: jpd123-sp26-c2-fe
- Subject ID: jpd123
- Exam type: FE
- Term: SP26
- Question count: 50

## Section: Reading

### Question 17

- Exam item ID: jpd123-sp26-c2-fe-item-017
- Question ID: jpd123-q-0042
- Question version: 1
- Original number: 17
```

Nếu cùng `questionId` lặp trong đề, export giữ đủ mọi vị trí nguồn. Source
metadata của Exam vẫn ở JSON nội bộ, không vào Markdown Gemini mặc định.

## learning-progress.md

Đây là tổng hợp từ lịch sử app hợp lệ: tổng quan môn, tóm tắt Exam đã hoàn tất,
và record của tất cả Question `active`, gồm cả câu chưa từng làm.

```md
# Learning Progress — JPD123

## Overall progress

- Total active questions: 250
- Not practiced: 80
- Learning: 45
- Weak: 30
- Developing: 35
- Stable: 40
- Mastered: 20
- Total recorded attempts: 600
- Correct: 390
- Incorrect: 150
- Unanswered: 60
- Overall correct rate: 65%

## Question progress

### [jpd123-q-0042]

- Study status: weak
- Attempt count: 5
- Correct: 2
- Incorrect: 2
- Unanswered: 1
- Correct rate: 40%
- Frequency band: frequent
- Last result: incorrect
- Last practiced at: 2026-07-30T20:15:00+07:00
```

`studyStatus` chỉ là nhãn export, tính lại từ lịch sử:

| Điều kiện | Study status |
|---|---|
| `attemptCount = 0` | `not_practiced` |
| `attemptCount = 1–3` | `learning` |
| Từ 4 lần, rate `<= 50%` | `weak` |
| Từ 4 lần, rate `> 50–75%` | `developing` |
| Từ 4 lần, rate `> 75–< 90%` | `stable` |
| Từ 4 lần, rate `>= 90%` | `mastered` |

Session đang làm dở không đổi `unansweredCount` hoặc `studyStatus`. Không
export lựa chọn thô, user identity hay interaction log.

## Chuyển blocks sang Markdown

| Block | Output |
|---|---|
| Markdown | Giữ nguyên Markdown gốc |
| Image | `![alt](assets/...)` với relative path |
| Table | GitHub-Flavored Markdown table |
| Code | Fenced code block, giữ language nếu có |

Giữ nguyên thứ tự block. Asset thiếu, path không an toàn hoặc block không hỗ
trợ là `error`; app không được tự bỏ/làm méo nội dung. Thiếu alt text là
`warning`.

## Hỏi AI một Question

**Hỏi AI** chỉ mở sau khi app ghi nhận kết quả: sau lựa chọn đầu tiên bị khóa
ở practice mode, hoặc sau exam submission. Prompt không gửi lựa chọn của người
học và giống nhau cho kết quả đúng/sai/bỏ trống.

Prompt phải gồm môn, `questionId`, ngữ cảnh Exam nếu có, toàn bộ Question,
options, correct answer và official explanation. Gemini được yêu cầu giải thích
kỹ: kiến thức kiểm tra, suy luận chọn đáp án, bẫy đáp án khác, quy tắc liên quan
và ví dụ ngắn nếu hữu ích. Nếu chưa có official explanation, Gemini phải nói
rõ đó là giải thích hỗ trợ học tập.

App copy prompt vào clipboard và mở Notebook URL của môn nếu được cấu hình.
Gemini response không tự ghi đè official explanation.

## Validation và vị trí giao diện

- Chỉ Subject `published` được tạo Gemini Pack chính thức.
- `error` chặn file/gói liên quan; không được bỏ im lặng Question active lỗi.
- `warning` cần người học xác nhận; thiếu explanation export là `Chưa có lời giải`.
- `info` không chặn export.
- Full pack bị chặn nếu file bắt buộc có error; Exam lỗi chỉ chặn Exam đó nếu
  export riêng.
- Export chỉ tạo download, không sửa dữ liệu app hoặc xóa file Notebook cũ.

Thao tác export đặt tại **Statistics/Progress** của Subject, trong khu vực
**Gemini Learning Documents**: Export Full Gemini Pack, Refresh Learning
Progress, chọn Exam published để kèm theo, và xem validation/last export.
Nút **Hỏi AI** ở màn hình kết quả Question.
