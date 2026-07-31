import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BANK_PATH = ROOT / 'subjects/jpd123/questions/questions.json'
SOURCE = [
    (Path(r'C:\Users\Lenovo\OneDrive\Documents\Ôn tập JPD\JPD123_FE_SP26_C2FE.md'), 'jpd123-sp26-c2fe', 'JPD123 Spring 2026 C2FE', 31),
    (Path(r'C:\Users\Lenovo\OneDrive\Documents\Ôn tập JPD\JPD123_FE_SP26_RE.md'), 'jpd123-sp26-re', 'JPD123 Spring 2026 RE', 30),
]
DUPLICATES = {'jpd123-q-0052':'jpd123-q-0051','jpd123-q-0065':'jpd123-q-0053','jpd123-q-0072':'jpd123-q-0066','jpd123-q-0108':'jpd123-q-0101','jpd123-q-0117':'jpd123-q-0114','jpd123-q-0137':'jpd123-q-0124'}

def norm(text): return re.sub(r'[\[\]【】\s\W_]+', '', text).lower()
def key(stem, options): return norm([x for x in stem.splitlines() if x.strip()][-1]) + '|' + '|'.join(map(norm, options))

bank = json.loads(BANK_PATH.read_text(encoding='utf-8'))
for q in bank['questions']:
    if q['id'] in DUPLICATES: q['active'] = False
lookup = {}
for q in bank['questions']:
    k = key(q['blocks'][0]['text'], [o['blocks'][0]['text'] for o in q['options']])
    if k not in lookup or q['active']: lookup[k] = q
next_id = max(int(q['id'].rsplit('-', 1)[1]) for q in bank['questions']) + 1
exams = []
for source, exam_id, title, expected in SOURCE:
    parts = re.split(r'^## Câu (\d+)\s*$', source.read_text(encoding='utf-8'), flags=re.M)
    items = []
    for i in range(1, len(parts), 2):
        number, body = int(parts[i]), re.sub(r'^---\s*$', '', parts[i+1], flags=re.M)
        matches = re.findall(r'^- ([A-D])\.\s+(.+?)\s*$', body, flags=re.M)
        stem = body[:body.find('- A.')].strip(); options = [x[1] for x in matches]
        if len(matches) != 4: raise ValueError(f'{exam_id} question {number}: options')
        k = key(stem, options)
        if k not in lookup:
            answer = re.search(r'\*\*Đáp án đúng:\*\*\s*([A-D])', body).group(1).lower()
            q = {'id': f'jpd123-q-{next_id:04d}', 'subjectId':'jpd123', 'version':1,
                 'blocks':[{'type':'markdown','text':stem}],
                 'options':[{'id':f'opt-{letter.lower()}','blocks':[{'type':'markdown','text':text}]} for letter,text in matches],
                 'correctAnswerIds':[f'opt-{answer}'], 'maxSelections':1, 'active':True}
            bank['questions'].append(q); lookup[k] = q; next_id += 1
        q = lookup[k]
        items.append({'examItemId':f'{exam_id}-item-{number:03d}','order':number,'originalNumber':number,'sectionId':None,'questionId':q['id'],'questionVersion':1})
    if len(items) != expected: raise ValueError(f'{exam_id}: expected {expected}')
    exams.append({'schemaVersion':'1.0','examId':exam_id,'subjectId':'jpd123','title':title,'examType':'FE','term':'SP26','status':'published','declaredQuestionCount':expected,'sections':[],'items':items})
if len({q['id'] for q in bank['questions']}) != len(bank['questions']): raise ValueError('duplicate IDs')
for exam in exams:
    if any(item['questionId'] not in {q['id'] for q in bank['questions']} for item in exam['items']): raise ValueError('missing reference')
BANK_PATH.write_text(json.dumps(bank, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
(ROOT/'subjects/jpd123/questions/duplicate-map.json').write_text(json.dumps({'schemaVersion':'1.0','subjectId':'jpd123','canonicalQuestionIdByDuplicateId':DUPLICATES},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for exam in exams: (ROOT/f"subjects/jpd123/exams/{exam['examId']}.json").write_text(json.dumps(exam,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f"questions={len(bank['questions'])}; active={sum(q['active'] for q in bank['questions'])}; exams={len(exams)}")
