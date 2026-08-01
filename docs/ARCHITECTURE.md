# Architecture

Status: Active for V1 frontend scope

## 1. Tổng quan

StudyPack là static web app chạy trên GitHub Pages. Frontend tải question bank,
subject configuration, exam và notebook documents từ các file versioned trong
repository. Không có backend runtime trong V1.

```text
GitHub Pages
  └── React + TypeScript + Vite
        ├── Content loader ──> public/subjects/*
        ├── Practice / Exam domain logic
        ├── Statistics and Gemini export
        └── Browser localStorage
              ├── AttemptRecord history
              ├── PracticeSession snapshot
              └── Gemini Notebook URL per subject
```

## 2. Repository layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| UI/application flow | `app/src/App.tsx` | Screen state, navigation và user interaction |
| Domain types | `app/src/types.ts` | Question, Subject, Exam, AttemptRecord và PracticeSession |
| Content loading | `app/src/content.ts` | Fetch dữ liệu static theo `BASE_URL` và content revision |
| Practice logic | `app/src/practice.ts` | Chọn câu, chấm đáp án, attempt history và PracticeSession persistence |
| Exam logic | `app/src/exam.ts` | Resolve ExamItem, mock exam và chấm đề |
| Statistics | `app/src/statistics.ts` | Tính learning status và tổng hợp theo `questionId` |
| Export/integration | `app/src/gemini-export.ts`, `app/src/ai-tutor.ts` | Tạo tài liệu và clipboard prompt cho Gemini Notebook |
| Static content | `subjects/` | Subject, question bank, exam, assets và notebook documents |
| Validation/build | `scripts/`, `schemas/`, `app/scripts/` | Validate content, copy content và verify deploy artifact |

## 3. Persistence boundary

V1 lưu progress trong browser của từng người học:

```text
studypack:{subjectId}:attempts:v1
studypack:{subjectId}:practice-session:v1
studypack:{subjectId}:ai-tutor:notebook-url:v1
```

- `attempts:v1` là lịch sử kết quả, dùng cho Statistics.
- `practice-session:v1` là snapshot có thể xóa sau khi hoàn thành Practice.
- Notebook URL là cấu hình riêng của browser, không nằm trong content JSON hoặc
  Gemini Pack.

Không đưa credentials, private learning profile hoặc dữ liệu cá nhân vào
`subjects/` hay repository.

## 4. Practice Session runtime flow

```text
Chọn Practice mode
  → chọn và cố định Question refs + version
  → lưu PracticeSession in_progress
  → trả lời / lưu AttemptRecord
  → cập nhật snapshot sau mỗi thao tác quan trọng
  → mở lại Subject
       ├── snapshot hợp lệ → hỏi Continue / Start new
       └── snapshot lỗi → xóa snapshot và học tiếp
  → hoàn thành câu cuối → xóa snapshot, giữ AttemptRecord
```

## 5. Ranh giới kiến trúc V1

- Không có API AI trực tiếp; Gemini Notebook nhận export và clipboard prompt.
- Không có authentication hoặc server-side progress.
- Không thay thế relational database bằng Google Sheets; database folder hiện
  không phải runtime persistence của frontend.
- Exam, Mock Exam và Practice dùng các flow UI riêng; chỉ Practice V1 có
  resume snapshot theo contract hiện tại.

## 6. Quality gates

Các thay đổi frontend phải kiểm tra tối thiểu:

```bash
npm run lint --prefix app
npm run test --prefix app -- --run
npm run build --prefix app
node scripts/validate-content.mjs
node scripts/verify-deploy-artifact.mjs
```

