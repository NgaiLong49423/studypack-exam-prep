> **Document:** JPD123 Reading and Vocabulary Contract<br>
> **File:** `docs/JPD123-READING-VOCABULARY-CONTRACT.md`<br>
> **Version:** v0.1.0<br>
> **Created:** 2026-08-04<br>
> **Last Updated:** 2026-08-04<br>
> **Status:** Under Review

# JPD123 Reading and Vocabulary Contract

## 1. Mục tiêu và phạm vi

Contract này định nghĩa học liệu **riêng cho môn JPD123**:

1. **Bài đọc song song**: tiếng Nhật và romaji được liên kết theo từng từ hoặc
   cụm từ để giao diện có thể highlight hai phía đồng thời.
2. **Từ vựng / Từ Hán**: bảng tra cứu theo từ viết, kana, romaji và nghĩa Việt.

Đây không phải một mô hình bắt buộc cho Subject khác. Không thay đổi semantics
của `Question`, `Exam`, `ExamItem`, `Topic` hoặc Progress hiện có.

## 2. Nguồn dữ liệu và cấu trúc thư mục

Markdown gốc được giữ nguyên để đối chiếu. JSON đã chuẩn hoá là nguồn dữ liệu
app đọc và validate.

```text
subjects/jpd123/
├── theory/                         # Markdown nguồn, không bị ghi đè
├── reading/
│   ├── reading-index.json
│   └── {readingDocumentId}.json
└── vocabulary/
    └── vocabulary.json
```

Các nguồn khởi tạo hiện tại là:

- `theory/phiên âm đọc - ôn tập kiểm tra bài 4-5-6.md`;
- `theory/phiên âm đọc - speaking test bài 6+7.md`;
- `theory/TỪ VỰNG JPD123 - TỔNG HỢP ÔN THI.md`.

Không được tự sửa Markdown nguồn để làm JSON dễ parse. Mọi lỗi hoặc điểm không
chắc chắn trong nguồn phải được phản ánh trong dữ liệu review/validation.

## 3. Reading document

`reading-index.json` chỉ quản lý danh sách và thứ tự tài liệu:

```json
{
  "schemaVersion": "1.0",
  "subjectId": "jpd123",
  "documents": [
    {
      "readingDocumentId": "jpd123-reading-review-4-5-6",
      "title": "Phiên âm đọc - Ôn tập kiểm tra bài 4-5-6",
      "file": "reading/jpd123-reading-review-4-5-6.json",
      "status": "draft",
      "order": 1
    }
  ]
}
```

Mỗi file `reading/{readingDocumentId}.json` chứa các bài đọc của một nguồn:

```json
{
  "schemaVersion": "1.0",
  "subjectId": "jpd123",
  "readingDocumentId": "jpd123-reading-review-4-5-6",
  "sourceMarkdown": "theory/phiên âm đọc - ôn tập kiểm tra bài 4-5-6.md",
  "passages": [
    {
      "passageId": "jpd123-reading-mary-napoli",
      "title": "Mary ở Napoli",
      "order": 1,
      "status": "draft",
      "sourceAppearances": [
        {
          "sourceMarkdown": "theory/phiên âm đọc - ôn tập kiểm tra bài 4-5-6.md",
          "sourceHeading": "1. Mary ở Napoli"
        }
      ],
      "paragraphs": []
    }
  ]
}
```

### 3.1. Passage và source appearances

- `passageId` ổn định, duy nhất trong JPD123; không đổi hoặc tái sử dụng sau
  khi đã phát hành.
- `title` là tên tiếng Việt hiển thị từ nguồn; không tự dịch hoặc đổi tên.
- `sourceAppearances` giữ mọi lần xuất hiện của cùng bài trong nhiều tài liệu.
- Hai bài được gộp khi người biên tập xác nhận nội dung Nhật và romaji là cùng
  một bài. Chỉ khi đó dùng chung một `passageId`; không xoá thông tin nguồn.
- Bài nghi trùng không được tự gộp. Nó ở trạng thái `draft`/review cho đến khi
  có quyết định của người dùng.

### 3.2. Paragraph và token alignment

Mỗi paragraph là một đơn vị cuộn đồng bộ. Mỗi token là đơn vị nhỏ nhất có thể
highlight ở hai cột. Token có thể là từ, trợ từ, số, dấu câu hoặc cụm cố định;
không tách Kanji thành từng ký tự nếu chúng thuộc cùng một từ.

```json
{
  "paragraphId": "jpd123-reading-mary-napoli-p-001",
  "japaneseText": "先週の土曜日、私は田中さんと近くの山でバーベキューをしました。",
  "romajiText": "Senshuu no doyoubi, watashi wa Tanaka-san to chikaku no yama de baabekyuu o shimashita.",
  "tokens": [
    {
      "tokenId": "jpd123-reading-mary-napoli-p-001-t-001",
      "japanese": "先週",
      "romaji": "Senshuu",
      "kind": "word"
    },
    {
      "tokenId": "jpd123-reading-mary-napoli-p-001-t-002",
      "japanese": "の",
      "romaji": "no",
      "kind": "particle"
    },
    {
      "tokenId": "jpd123-reading-mary-napoli-p-001-t-003",
      "japanese": "土曜日",
      "romaji": "doyoubi",
      "kind": "word"
    }
  ],
  "translationVi": null
}
```

Quy tắc:

- `paragraphId` và `tokenId` ổn định sau khi publish.
- `japaneseText` và `romajiText` là bản hiển thị đầy đủ, theo đúng nguồn sau
  khi xử lý whitespace trình bày; không được tự sửa ngữ nghĩa.
- Mỗi token bắt buộc có `japanese`, `romaji` và `kind` không rỗng.
- `kind` thuộc `word`, `particle`, `number`, `punctuation` hoặc `phrase`.
- Một token Nhật tương ứng chính xác một token romaji. App dùng cùng `tokenId`
  để highlight hai phía; không suy luận bằng tìm chuỗi trên UI.
- `translationVi` là tuỳ chọn; giá trị mặc định là `null`. Không tự tạo bản dịch
  khi nguồn không có bản dịch.
- Token không rõ cách đọc, ranh giới từ hoặc romaji phải có validation issue mức
  `error`; không tự đoán từ Kanji hoặc ngữ cảnh.

## 4. Vocabulary

`vocabulary/vocabulary.json` là danh sách từ vựng JPD123, không phải Question.

```json
{
  "schemaVersion": "1.0",
  "subjectId": "jpd123",
  "entries": [
    {
      "vocabularyId": "jpd123-v-0001",
      "written": "土曜日",
      "kanji": "土曜日",
      "kana": "どようび",
      "romaji": "doyoubi",
      "meaningVi": "Thứ Bảy",
      "categoryId": "time-number-frequency",
      "sourceRefs": [
        {
          "sourceMarkdown": "theory/TỪ VỰNG JPD123 - TỔNG HỢP ÔN THI.md",
          "sourceSection": "1. Thời gian, số và tần suất"
        }
      ],
      "status": "draft"
    }
  ]
}
```

Quy tắc:

- `vocabularyId` có dạng `jpd123-v-` theo sau bởi số tăng dần, ổn định và duy
  nhất. Không đổi hoặc tái sử dụng ID đã phát hành.
- `written`, `kana`, `romaji`, `meaningVi`, `categoryId` là bắt buộc và không
  rỗng.
- `kanji` là `string` khi từ có Kanji; với từ chỉ Kana/Katakana, giá trị là
  `null`. Các từ không Kanji vẫn được giữ trong bảng.
- `written` giữ đúng dạng từ nguồn, ví dụ Kanji, Kana hoặc Katakana; không tự
  chuyển toàn bộ từ về Kanji.
- `sourceRefs` lưu nguồn gốc của entry; có thể có nhiều nguồn.
- Entry trùng chắc chắn chỉ dùng một `vocabularyId` và cộng dồn `sourceRefs`.
  Entry nghi trùng (cùng chữ nhưng khác cách đọc hoặc nghĩa) không tự gộp.
- Không tự tạo Kana, romaji, nghĩa Việt, category hay liên kết bài đọc khi
  nguồn chưa thể xác nhận.

## 5. Quan hệ giữa bài đọc và từ vựng

Một vocabulary entry có thể được liên kết với bài đọc sau khi biên tập xác
nhận, bằng field tuỳ chọn `passageRefs`:

```json
"passageRefs": [
  {
    "passageId": "jpd123-reading-mary-napoli",
    "tokenIds": ["jpd123-reading-mary-napoli-p-001-t-003"]
  }
]
```

Liên kết này hỗ trợ mở bài đọc có chứa từ hoặc highlight token liên quan. Nó
không bắt buộc để publish Reading hoặc Vocabulary, và không được suy luận tự
động chỉ từ nội dung giống nhau.

## 6. Trạng thái và validation

`status` của Reading Document, Passage và Vocabulary Entry là `draft`,
`published` hoặc `archived`.

Các lỗi `error` chặn publish:

- ID thiếu, sai định dạng hoặc trùng.
- `subjectId` khác `jpd123`.
- File JSON, `sourceMarkdown` hoặc `sourceRefs` trỏ ra ngoài Subject Pack.
- Paragraph thiếu text hoặc token; token thiếu `japanese`, `romaji`, `kind`.
- Token không thể ghép lại thành text paragraph sau khi bỏ qua whitespace trình
  bày và khoảng cách romaji chuẩn.
- `passageRefs.passageId` hoặc `tokenIds` không tồn tại.
- Vocabulary thiếu trường bắt buộc; `kanji` không phải `null`/string.
- Còn validation issue mức `error` trong dữ liệu được publish.

Các cảnh báo `warning`:

- Bài đọc hoặc từ vựng nghi trùng.
- Bài đọc không có liên kết từ vựng, hoặc từ vựng không có `passageRefs`.
- Hai entry có `written` giống nhau nhưng khác kana, romaji hoặc nghĩa.
- `translationVi` chưa có.

Các thông tin `info`:

- Vocabulary entry không có Kanji.
- Bài đọc chưa có liên kết Topic.
- Bài đọc xuất hiện ở nhiều nguồn.

## 7. Thứ tự import

1. Giữ nguyên ba Markdown nguồn.
2. Tạo Reading/Vocabulary JSON ở trạng thái `draft`.
3. Tạo token alignment từng paragraph; tạo validation issue cho mọi điểm không
   xác định, lỗi nguồn hoặc nghi trùng.
4. Validate toàn bộ JSON và rà soát item review.
5. Chỉ publish khi không còn issue mức `error`.
6. UI chỉ đọc JSON `published`; không tự sửa dữ liệu trong lúc hiển thị.

## 8. Ranh giới V1

- V1 không tự dịch, tự tokenize, tự suy luận cách đọc Kanji hoặc tự gộp bài/từ
  nghi trùng.
- V1 không thay thế Progress của Question bằng tiến độ Reading/Vocabulary.
- V1 chưa quy định UI cụ thể, audio, spaced repetition hay flashcard; các phần
  đó chỉ được phân rã sau khi contract dữ liệu này được chốt.
