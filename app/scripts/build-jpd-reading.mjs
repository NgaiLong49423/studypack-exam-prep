import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import kuromoji from 'kuromoji'
import wanakana from 'wanakana'

const repositoryRoot = resolve(import.meta.dirname, '..', '..')
const subjectRoot = resolve(repositoryRoot, 'subjects', 'jpd123')
const theoryRoot = resolve(subjectRoot, 'theory')
const readingRoot = resolve(subjectRoot, 'reading')
const vocabularyRoot = resolve(subjectRoot, 'vocabulary')

const sources = [
  { id: 'jpd123-reading-review-4-5-6', title: 'Ôn tập kiểm tra bài 4-5-6', file: 'phiên âm đọc - ôn tập kiểm tra bài 4-5-6.md' },
  { id: 'jpd123-reading-speaking-6-7', title: 'Speaking ôn tập test bài 6+7', file: 'phiên âm đọc - speaking test bài 6+7.md' },
]
const vocabularySource = 'TỪ VỰNG JPD123 - TỔNG HỢP ÔN THI.md'

const tokenizer = await new Promise((resolveTokenizer, reject) => {
  kuromoji.builder({ dicPath: resolve(repositoryRoot, 'app', 'node_modules', 'kuromoji', 'dict') }).build((error, builtTokenizer) => {
    if (error) reject(error)
    else resolveTokenizer(builtTokenizer)
  })
})

const slug = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const compact = (value) => value.replace(/\s+/g, '')
const isPunctuation = (value) => /^[、。！？?!.「」『』（）()]+$/u.test(value)
const capitalize = (value) => value ? `${value[0].toUpperCase()}${value.slice(1)}` : value
const numberRomaji = (value) => {
  const number = Number(value)
  const units = ['', 'ichi', 'ni', 'san', 'yon', 'go', 'roku', 'nana', 'hachi', 'kyuu']
  if (!Number.isInteger(number) || number < 0 || number > 99) return value
  if (number < 10) return units[number]
  const tens = Math.floor(number / 10)
  const remainder = number % 10
  return `${tens === 1 ? '' : units[tens]}juu${units[remainder]}`
}
const counterRomaji = (number, counter) => {
  const value = Number(number)
  if (counter === '人') return ({ 1: 'hitori', 2: 'futari', 3: 'sannin', 4: 'yonin', 5: 'gonin', 6: 'rokunin', 7: 'nananin', 8: 'hachinin', 9: 'kyuunin', 10: 'juunin' })[value] ?? `${numberRomaji(number)}nin`
  if (counter === '日') return ({ 1: 'ichinichi', 2: 'futsuka', 3: 'mikka', 4: 'yokka', 5: 'itsuka', 6: 'muika', 7: 'nanoka', 8: 'youka', 9: 'kokonoka', 10: 'tooka' })[value] ?? `${numberRomaji(number)}nichi`
  if (counter === '時') return ({ 1: 'ichiji', 2: 'niji', 3: 'sanji', 4: 'yoji', 5: 'goji', 6: 'rokuji', 7: 'shichiji', 8: 'hachiji', 9: 'kuji', 10: 'juuji', 11: 'juuichiji', 12: 'juuniji' })[value] ?? `${numberRomaji(number)}ji`
  if (counter === '時半') return ({ 1: 'ichijihan', 2: 'nijihan', 3: 'sanjihan', 4: 'yojihan', 5: 'gojihan', 6: 'rokujihan', 7: 'shichijihan', 8: 'hachijihan', 9: 'kujihan', 10: 'juujihan', 11: 'juuichijihan', 12: 'juunijihan' })[value] ?? `${numberRomaji(number)}jihan`
  if (counter === '才') {
    if (value % 10 === 8) return `${numberRomaji(number).replace(/hachi$/, '')}hassai`
    if (value % 10 === 0) return `${numberRomaji(number).replace(/juu$/, '')}jussai`
    return ({ 1: 'issai' })[value] ?? `${numberRomaji(number)}sai`
  }
  if (counter === 'かい' || counter === '階') {
    if (value % 10 === 8) return `${numberRomaji(number).replace(/hachi$/, '')}hakkai`
    if (value % 10 === 0) return `${numberRomaji(number).replace(/juu$/, '')}jukkai`
    return ({ 1: 'ikkai', 3: 'sankai', 4: 'yonkai', 6: 'rokkai' })[value] ?? `${numberRomaji(number)}kai`
  }
  if (counter === '年生') return `${numberRomaji(number)}nensei`
  if (counter === '年間') return `${numberRomaji(number)}nenkan`
  return `${numberRomaji(number)}${counter === '時間' ? 'jikan' : counter}`
}

const particleReading = { は: 'wa', へ: 'e', を: 'o' }
const romajiForRawToken = (token) => {
  if (isPunctuation(token.surface_form)) return token.surface_form
  if (token.pos === '助詞' && particleReading[token.surface_form]) return particleReading[token.surface_form]
  const reading = token.reading && token.reading !== '*' ? token.reading : token.surface_form
  return wanakana.toRomaji(reading, { upcaseKatakana: false })
}
const isHonorificSuffix = (token) => token?.pos === '名詞' && token.pos_detail_1 === '接尾' && ['さん', '先生', 'ちゃん', '君', 'くん', '様'].includes(token.surface_form)
const isIndependentVerb = (token) => token?.pos === '動詞' && token.pos_detail_1 === '自立'
const isInflectionPart = (token) => token?.pos === '助動詞' || ['ます', 'まし', 'た', 'ませ', 'ん', 'たい', 'です'].includes(token?.surface_form) || (token?.pos === '助詞' && ['て', 'で'].includes(token.surface_form)) || (token?.pos === '動詞' && token.pos_detail_1 === '非自立')
const isProtectedVocabularyForm = (form) => form.length >= 2
const readingPhraseOverrides = [
  { form: 'おかあさん', romaji: 'okaasan' },
]

function tokenizeWithVocabularyOverlay(japaneseText, protectedVocabularyByForm) {
  const rawTokens = []
  let unprotectedText = ''
  const flushUnprotectedText = () => {
    if (unprotectedText) rawTokens.push(...tokenizer.tokenize(unprotectedText))
    unprotectedText = ''
  }
  for (let index = 0; index < japaneseText.length;) {
    const matched = protectedVocabularyByForm.find(({ form }) => japaneseText.startsWith(form, index))
    if (matched) {
      flushUnprotectedText()
      rawTokens.push({ surface_form: matched.form, reading: matched.romaji, knownRomaji: matched.romaji, pos: '名詞', kind: 'phrase' })
      index += matched.form.length
    } else {
      unprotectedText += japaneseText[index]
      index += 1
    }
  }
  flushUnprotectedText()
  return rawTokens
}

function makePhrase(rawTokens, start, end, romajiSegments = [[start, end]]) {
  const phraseTokens = rawTokens.slice(start, end)
  return {
    end,
    japanese: phraseTokens.map((token) => token.surface_form).join(''),
    romaji: capitalize(romajiSegments.map(([segmentStart, segmentEnd]) => rawTokens.slice(segmentStart, segmentEnd).map(romajiForRawToken).join('')).join(' ')),
    kind: 'phrase',
  }
}

function findConjugatedPhrase(rawTokens, start) {
  const first = rawTokens[start]
  if (!isIndependentVerb(first) && !(first?.pos === '形容詞' && first.pos_detail_1 === '自立') && !['し', 'でし'].includes(first?.surface_form) && !(first?.knownRomaji && isInflectionPart(rawTokens[start + 1]))) return null
  let end = start + 1
  while (isInflectionPart(rawTokens[end])) end += 1
  return end > start + 1 ? makePhrase(rawTokens, start, end) : null
}

function tokenizeJapanese(japaneseText, passageId, paragraphId, vocabularyByForm, protectedVocabularyByForm) {
  const rawTokens = tokenizeWithVocabularyOverlay(japaneseText, protectedVocabularyByForm)
  const tokens = []
  for (let index = 0; index < rawTokens.length;) {
    const numeral = rawTokens[index].surface_form
    const counter = rawTokens[index + 1]?.surface_form
    if (/^\d+$/.test(numeral) && ['人', '日', '時', '時半', '時間', '才', 'かい', '階', '年生', '年間'].includes(counter)) {
      tokens.push({ surface_form: `${numeral}${counter}`, reading: counterRomaji(numeral, counter), pos: '名詞', knownRomaji: counterRomaji(numeral, counter), kind: 'number' })
      index += 2
      continue
    }
    if (rawTokens[index + 1]?.surface_form === 'じゃ' && rawTokens[index + 2]?.surface_form === 'あり' && rawTokens[index + 3]?.surface_form === 'ませ' && rawTokens[index + 4]?.surface_form === 'ん') {
      tokens.push(makePhrase(rawTokens, index, index + 5, [[index, index + 1], [index + 1, index + 2], [index + 2, index + 5]]))
      index += 5
      continue
    }
    if (rawTokens[index]?.pos === '名詞' && rawTokens[index + 1]?.surface_form === 'し') {
      const conjugatedPhrase = findConjugatedPhrase(rawTokens, index + 1)
      if (conjugatedPhrase) {
        tokens.push(makePhrase(rawTokens, index, conjugatedPhrase.end, [[index, index + 1], [index + 1, conjugatedPhrase.end]]))
        index = conjugatedPhrase.end
        continue
      }
    }
    if (rawTokens[index]?.pos === '名詞' && isHonorificSuffix(rawTokens[index + 1])) {
      tokens.push(makePhrase(rawTokens, index, index + 2, [[index, index + 1], [index + 1, index + 2]]))
      index += 2
      continue
    }
    if (rawTokens[index + 1]?.surface_form === 'に' && isIndependentVerb(rawTokens[index + 2]) && rawTokens[index + 2].surface_form.startsWith('行')) {
      const verbPhrase = findConjugatedPhrase(rawTokens, index + 2)
      const end = verbPhrase?.end ?? index + 3
      tokens.push(makePhrase(rawTokens, index, end, [[index, index + 1], [index + 1, index + 2], [index + 2, end]]))
      index = end
      continue
    }
    const conjugatedPhrase = findConjugatedPhrase(rawTokens, index)
    if (conjugatedPhrase) {
      tokens.push(conjugatedPhrase)
      index = conjugatedPhrase.end
      continue
    }
    if (rawTokens[index].knownRomaji) {
      tokens.push(rawTokens[index])
      index += 1
      continue
    }
    let matched = null
    for (let end = Math.min(rawTokens.length, index + 6); end > index; end -= 1) {
      const japanese = rawTokens.slice(index, end).map((token) => token.surface_form).join('')
      if (vocabularyByForm.has(japanese)) { matched = { end, japanese, romaji: vocabularyByForm.get(japanese) }; break }
    }
    if (matched) {
      tokens.push({ surface_form: matched.japanese, reading: matched.romaji, pos: '名詞', knownRomaji: matched.romaji })
      index = matched.end
    } else {
      tokens.push(rawTokens[index])
      index += 1
    }
  }
  return tokens.map((token, index) => {
    const japanese = token.japanese ?? token.surface_form
    const reading = token.reading && token.reading !== '*' ? token.reading : japanese
    const particleRomaji = token.pos === '助詞' ? ({ は: 'Wa', へ: 'E', を: 'O' }[japanese] ?? null) : null
    const romaji = token.romaji ?? (isPunctuation(japanese) ? japanese : token.knownRomaji ? capitalize(token.knownRomaji) : particleRomaji ?? capitalize(wanakana.toRomaji(reading, { upcaseKatakana: false })))
    return {
      tokenId: `${passageId}-${paragraphId}-t-${String(index + 1).padStart(3, '0')}`,
      japanese,
      romaji,
      kind: token.kind ?? (isPunctuation(japanese) ? 'punctuation' : token.pos === '助詞' ? 'particle' : token.pos === '記号' ? 'punctuation' : 'word'),
    }
  })
}

function parseReadingMarkdown(markdown, source, vocabularyByForm, protectedVocabularyByForm) {
  const blocks = markdown.split(/\r?\n(?=##\s+\d+\.)/)
  return blocks.filter((block) => /^##\s+\d+\./m.test(block)).map((block, index) => {
    const heading = block.match(/^##\s+\d+\.\s+(.+)$/m)?.[1]?.trim()
    const japanese = block.match(/\*\*Tiếng Nhật\*\*\s*\r?\n\s*([^\r\n]+)/)?.[1]?.trim()
    const sourceRomaji = block.match(/\*\*Romaji\*\*\s*\r?\n\s*([^\r\n]+)/)?.[1]?.trim()
    if (!heading || !japanese || !sourceRomaji) throw new Error(`Không thể đọc bài số ${index + 1} trong ${source.file}.`)
    const passageId = `${source.id}-${String(index + 1).padStart(2, '0')}-${slug(heading)}`
    const paragraphId = 'p-001'
    const tokens = tokenizeJapanese(japanese, passageId, paragraphId, vocabularyByForm, protectedVocabularyByForm)
    if (compact(tokens.map((token) => token.japanese).join('')) !== compact(japanese)) throw new Error(`Tokenizer không giữ nguyên tiếng Nhật của ${passageId}.`)
    return {
      passageId,
      title: heading,
      order: index + 1,
      status: 'published',
      sourceAppearances: [{ sourceMarkdown: `theory/${source.file}`, sourceHeading: `${index + 1}. ${heading}` }],
      paragraphs: [{ paragraphId, japaneseText: japanese, sourceRomajiText: sourceRomaji, tokens }],
    }
  })
}

function parseVocabulary(markdown) {
  let categoryId = 'uncategorized'
  let categoryName = 'Chưa phân loại'
  let counter = 0
  const entries = []
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+\d+\.\s+(.+)$/)
    if (heading) { categoryName = heading[1].trim(); categoryId = slug(categoryName); continue }
    const cells = line.match(/^\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*$/)
    if (!cells || cells[1] === 'Từ' || /^-+$/.test(cells[1])) continue
    const [, written, kanaRomaji, meaningVi] = cells
    const reading = kanaRomaji.match(/^(.*?)\s*\(([^)]+)\)\s*$/)
    const kana = reading ? reading[1].trim() : /^(?:[\p{Script=Hiragana}\p{Script=Katakana}ー〜・/\s]+)$/u.test(written) ? written : null
    const romaji = reading ? reading[2].trim() : kana ? kanaRomaji.trim() : null
    if (!kana || !romaji) throw new Error(`Không thể tách Kana/Romaji của từ: ${written}`)
    counter += 1
    entries.push({
      vocabularyId: `jpd123-v-${String(counter).padStart(4, '0')}`,
      written,
      kanji: /\p{Script=Han}/u.test(written) ? written : null,
      kana,
      romaji,
      meaningVi,
      categoryId,
      categoryName,
      sourceRefs: [{ sourceMarkdown: `theory/${vocabularySource}`, sourceSection: categoryName }],
      status: 'published',
    })
  }
  return entries
}

await Promise.all([mkdir(readingRoot, { recursive: true }), mkdir(vocabularyRoot, { recursive: true })])
const vocabularyMarkdown = await readFile(resolve(theoryRoot, vocabularySource), 'utf8')
const entries = parseVocabulary(vocabularyMarkdown)
const vocabularyByForm = new Map()
for (const entry of entries) {
  for (const form of [entry.written, entry.kana]) {
    if (form && !form.includes('/') && !vocabularyByForm.has(form)) vocabularyByForm.set(form, entry.romaji)
  }
}
const protectedVocabularyByForm = [...new Map([
  ...[...vocabularyByForm.entries()].filter(([form]) => isProtectedVocabularyForm(form)),
  ...readingPhraseOverrides.map(({ form, romaji }) => [form, romaji]),
]).entries()]
  .map(([form, romaji]) => ({ form, romaji }))
  .sort((left, right) => right.form.length - left.form.length)
const documentIndex = []
for (const source of sources) {
  const markdown = await readFile(resolve(theoryRoot, source.file), 'utf8')
  const passages = parseReadingMarkdown(markdown, source, vocabularyByForm, protectedVocabularyByForm)
  const output = { schemaVersion: '1.0', subjectId: 'jpd123', readingDocumentId: source.id, title: source.title, sourceMarkdown: `theory/${source.file}`, passages }
  const outputFile = `${source.id}.json`
  await writeFile(resolve(readingRoot, outputFile), `${JSON.stringify(output, null, 2)}\n`, 'utf8')
  documentIndex.push({ readingDocumentId: source.id, title: source.title, file: `reading/${outputFile}`, status: 'published', order: documentIndex.length + 1, passageCount: passages.length })
}
await writeFile(resolve(readingRoot, 'reading-index.json'), `${JSON.stringify({ schemaVersion: '1.0', subjectId: 'jpd123', documents: documentIndex }, null, 2)}\n`, 'utf8')
await writeFile(resolve(vocabularyRoot, 'vocabulary.json'), `${JSON.stringify({ schemaVersion: '1.0', subjectId: 'jpd123', entries }, null, 2)}\n`, 'utf8')
console.log(`Generated ${documentIndex.reduce((total, document) => total + document.passageCount, 0)} passages and ${entries.length} vocabulary entries.`)
