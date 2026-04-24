import os
import json
import re
import fitz  # PyMuPDF

PDF_DIR = r"E:\Đề anh văn lớp 10"
OUTPUT_JSON = r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\mock-test-app\public\data\tests_native.json"
OLD_TESTS_JSON = r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\mock-test-app\public\data\tests.json"

# Load old tests to get the answer keys
with open(OLD_TESTS_JSON, 'r', encoding='utf-8') as f:
    old_tests = json.load(f)
    answers_map = {t['filename']: t.get('answers', []) for t in old_tests}

def parse_pdf(filepath, filename):
    doc = fitz.open(filepath)
    text = ""
    for page in doc:
        text += page.get_text("text") + "\n"
        
    lines = text.split("\n")
    
    questions = []
    current_q = None
    
    # State tracking
    q_pattern = re.compile(r'^Question (\d+)\s*\(Question ID:')
    sub_q_pattern = re.compile(r'^Q(\d+\.\d+)\.?\s+(.*)')
    opt_pattern = re.compile(r'^([A-D])\.\s+(.*)')
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line or line.startswith("Đề thi được tải về") or line.isdigit():
            i += 1
            continue
            
        # Match main question
        m_q = q_pattern.search(line)
        if m_q:
            if current_q:
                questions.append(current_q)
            q_num = m_q.group(1)
            current_q = {
                "id": q_num,
                "label": q_num,
                "prompt": "",
                "options": {},
                "subQuestions": [],
                "type": "text" # default to text, switch to mcq if options found
            }
            i += 1
            continue
            
        if current_q:
            # Check for inline subquestions like "Q17.1. A. disappointed   B. interested ..."
            m_sub = sub_q_pattern.search(line)
            if m_sub:
                sub_label = m_sub.group(1)
                rest = m_sub.group(2)
                # Parse options inline if they exist
                opts = {}
                # Naive split by " A. ", " B. ", " C. ", " D. "
                # Using regex to find A., B., C., D.
                opt_matches = list(re.finditer(r'([A-D])\.\s+([^\sA-D][^A-D]*?(?=\s+[A-D]\.\s+|$))', rest))
                if opt_matches:
                    for om in opt_matches:
                        opts[om.group(1)] = om.group(2).strip()
                    
                current_q["subQuestions"].append({
                    "id": sub_label,
                    "label": sub_label,
                    "options": opts,
                    "type": "mcq" if opts else "text"
                })
                i += 1
                continue
                
            # Check for regular options A. B. C. D. on their own lines
            m_opt = opt_pattern.search(line)
            if m_opt and not current_q["subQuestions"]:
                opt_letter = m_opt.group(1)
                opt_text = m_opt.group(2)
                current_q["options"][opt_letter] = opt_text
                current_q["type"] = "mcq"
                i += 1
                continue
                
            # If it's none of the above, it's just prompt text
            current_q["prompt"] += line + "\n"
            
        i += 1
        
    if current_q:
        questions.append(current_q)
        
    # Now we flatten and assign answers from the old system (mocked or real)
    # The old system assumes exactly 40 items.
    flattened = []
    
    ans_list = answers_map.get(filename, [])
    ans_idx = 0
    
    for q in questions:
        q["prompt"] = q["prompt"].strip()
        if q["subQuestions"]:
            for sq in q["subQuestions"]:
                correct = ans_list[ans_idx] if ans_idx < len(ans_list) else ""
                sq["answer"] = correct
                ans_idx += 1
        else:
            correct = ans_list[ans_idx] if ans_idx < len(ans_list) else ""
            q["answer"] = correct
            ans_idx += 1
            
    return questions

tests_data = []

for idx, filename in enumerate(sorted(os.listdir(PDF_DIR))):
    if not filename.lower().endswith(".pdf"):
        continue
    
    filepath = os.path.join(PDF_DIR, filename)
    
    try:
        qs = parse_pdf(filepath, filename)
        name = filename.replace(".pdf", "").replace("-", " ").title()
        if "Quiz_" in name:
            name = name.split("_")[-1].strip()
            
        tests_data.append({
            "id": str(idx + 1),
            "title": name,
            "filename": filename,
            "questions": qs
        })
    except Exception as e:
        print(f"Error parsing {filename}: {e}")

os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(tests_data, f, ensure_ascii=False, indent=2)

print(f"Parsed {len(tests_data)} tests into native format.")
