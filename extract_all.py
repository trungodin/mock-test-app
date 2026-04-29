import docx
from docx.enum.text import WD_COLOR_INDEX
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def find_highlighted_letter(para):
    """Find the A/B/C/D letter that has YELLOW highlight in a paragraph."""
    letter_re = re.compile(r'^([A-D])$')
    for run in para.runs:
        text = run.text.strip()
        if not text:
            continue
        # Check if this run has yellow highlight
        try:
            if run.font.highlight_color == WD_COLOR_INDEX.YELLOW:
                m = letter_re.match(text)
                if m:
                    return m.group(1).upper()
        except:
            pass
    return None

def extract_all_tests(file_path):
    doc = docx.Document(file_path)
    
    # Build parallel arrays of (text, paragraph_object)
    para_data = [(p.text.strip(), p) for p in doc.paragraphs if p.text.strip()]
    paras = [d[0] for d in para_data]
    para_objs = [d[1] for d in para_data]
    
    # === 1. FIND TEST BOUNDARIES ===
    end_marker = "TỔNG KẾT ĐIỂM"
    section_I_re = re.compile(r'^I\.\s+Choose.*(?:underlined|pronounced)', re.IGNORECASE)
    
    test_starts = [i for i, p in enumerate(paras) if section_I_re.search(p)]
    test_boundaries = []
    for idx, start in enumerate(test_starts):
        end = test_starts[idx + 1] if idx + 1 < len(test_starts) else len(paras)
        for j in range(start, end):
            if end_marker in paras[j].upper():
                end = j
                break
        test_boundaries.append((start, end))
    
    print(f"Found {len(test_boundaries)} test boundaries")
    
    # === 2. PATTERNS ===
    section_headers = {
        'I': re.compile(r'^I\.\s+Choose.*(?:underlined|pronounced)', re.IGNORECASE),
        'II': re.compile(r'^II\.\s+Choose.*stress', re.IGNORECASE),
        'III': re.compile(r'^III\.\s+Choose.*(?:word|phrase).*(?:fits|best|space|sentence)', re.IGNORECASE),
        'IV': re.compile(r'^IV\.?\s+Choose.*(?:picture|sign)', re.IGNORECASE),
        'V': re.compile(r'^V\.?\s+Choose.*(?:blank|passage)', re.IGNORECASE),
        'VI': re.compile(r'^VI\.?\s+Read.*(?:TRUE|FALSE|passage)', re.IGNORECASE),
        'VII': re.compile(r'^VII\.?\s+Use.*correct.*form', re.IGNORECASE),
        'VIII': re.compile(r'^VIII\.?\s+Look.*(?:entry|dictionary)', re.IGNORECASE),
        'IX': re.compile(r'^IX\.?\s+Rewrite', re.IGNORECASE),
    }
    
    section_q_map = {
        'I': [1, 2], 'II': [3, 4],
        'III': list(range(5, 15)), 'IV': [15, 16],
        'V': list(range(17, 23)),
        'VI_TF': [23, 24, 25, 26], 'VI_MCQ': [27, 28],
        'VII': list(range(29, 35)), 'VIII': [35, 36], 'IX': list(range(37, 41)),
    }
    
    q17_special = re.compile(r'^1[\.:]\s+17[\.:]\s+([A-D])[\.:]\s*(.*)', re.IGNORECASE)
    q_pattern = re.compile(r'^(?:\d+[\.:]\s+)*?(\d+)[\.:]\s+(.*)', re.IGNORECASE)
    tf_pattern = re.compile(r'\b(TRUE|FALSE|FASLE)\b', re.IGNORECASE)
    mcq_start_pattern = re.compile(r'^\s*([A-D])[\.:]\s+(.*)', re.IGNORECASE)
    ans_keyword_pattern = re.compile(r'(?:^|\s)[Đđ][áa]p\s*[áa]n\s*:\s*(.*)', re.IGNORECASE)
    answer_english_pattern = re.compile(r'^Answer\s*:\s*(.*)', re.IGNORECASE)
    
    all_tests = []
    
    for test_idx, (t_start, t_end) in enumerate(test_boundaries):
        answers = {}
        current_section = None
        section_q_idx = 0
        vi_phase = 'TF'
        used_lines = set()  # Lines consumed by lookahead
        
        for i in range(t_start, t_end):
            if i in used_lines:
                continue
            text = paras[i]
            para_obj = para_objs[i]
            
            # === Detect section headers ===
            new_section = None
            for sec_name, sec_re in section_headers.items():
                if sec_re.search(text):
                    new_section = sec_name
                    break
            
            if new_section:
                current_section = new_section
                section_q_idx = 0
                if new_section == 'VI':
                    vi_phase = 'TF'
                continue
            
            if not current_section:
                continue
            
            # === SECTIONS I & II: Use YELLOW highlight to find answer ===
            if current_section in ['I', 'II']:
                # Check if this paragraph has a highlighted letter
                highlighted = find_highlighted_letter(para_obj)
                if highlighted:
                    q_range = section_q_map.get(current_section, [])
                    if section_q_idx < len(q_range):
                        answers[str(q_range[section_q_idx])] = highlighted
                        section_q_idx += 1
                continue
            
            # === Special handling for "1. 17. A. then" pattern ===
            q17_match = q17_special.match(text)
            if q17_match and current_section == 'V':
                answers['17'] = q17_match.group(1).upper()
                section_q_idx = 1
                continue
            
            # === Try explicit numbered question ===
            q_match = q_pattern.match(text)
            if q_match:
                q_num = int(q_match.group(1))
                remainder = q_match.group(2).strip()
                
                if remainder.startswith("Choose") or remainder.startswith("Read") or remainder.startswith("Use") or remainder.startswith("Look") or remainder.startswith("Rewrite"):
                    continue
                
                final_ans = ""
                if 1 <= q_num <= 22 or 27 <= q_num <= 28:
                    # Try highlight first
                    highlighted = find_highlighted_letter(para_obj)
                    if highlighted:
                        final_ans = highlighted
                    else:
                        m = mcq_start_pattern.match(remainder)
                        if m:
                            final_ans = m.group(1).upper()
                        else:
                            m2 = re.match(r'\s*([A-D])\b', remainder)
                            if m2:
                                final_ans = m2.group(1).upper()
                elif 23 <= q_num <= 26:
                    m = tf_pattern.search(remainder)
                    if m:
                        val = m.group(1).capitalize()
                        final_ans = 'False' if val == 'Fasle' else val
                elif q_num >= 29:
                    found = False
                    # Check current line for "Đáp án:" or "Answer:"
                    for pat in [ans_keyword_pattern, answer_english_pattern]:
                        m = pat.search(remainder) if pat == ans_keyword_pattern else pat.match(remainder)
                        if m:
                            final_ans = m.group(1).strip()
                            found = True
                            break
                    if not found:
                        # Lookahead for "Đáp án:" or "Answer:" in next lines
                        for j in range(1, 15):
                            if i + j >= t_end: break
                            nxt = paras[i+j]
                            if q_pattern.match(nxt): break
                            hit_header = False
                            for hdr_re in section_headers.values():
                                if hdr_re.search(nxt):
                                    hit_header = True
                                    break
                            if hit_header: break
                            for pat in [ans_keyword_pattern, answer_english_pattern]:
                                m = pat.search(nxt) if pat == ans_keyword_pattern else pat.match(nxt)
                                if m:
                                    final_ans = m.group(1).strip()
                                    found = True
                                    used_lines.add(i + j)
                                    break
                            if found: break
                    if not found and current_section == 'VIII' and q_num in [35, 36]:
                        # Section VIII (dictionary): use remainder directly as the answer
                        # Format: "35: Hard work is the key to success."
                        final_ans = remainder
                    if not found and current_section == 'IX' and q_num in range(37, 41):
                        # Section IX (rewrite): use remainder if it looks like a sentence
                        if len(remainder) > 10 and not remainder.startswith('Dạng') and not remainder.startswith('Dấu') and not remainder.startswith('Quy'):
                            final_ans = remainder
                
                if final_ans:
                    if q_num >= 29 and final_ans.endswith('.'):
                        final_ans = final_ans[:-1].strip()
                    answers[str(q_num)] = final_ans
                    
                    # Sync section_q_idx so context-based parser stays in sync
                    if current_section:
                        for sec_key in ['I', 'II', 'III', 'IV', 'V', 'VI_TF', 'VI_MCQ', 'VII', 'VIII', 'IX']:
                            q_range = section_q_map.get(sec_key, [])
                            if q_num in q_range:
                                new_idx = q_range.index(q_num) + 1
                                # Only update if this is the active section
                                if current_section == 'VI' and sec_key in ['VI_TF', 'VI_MCQ']:
                                    if sec_key == 'VI_TF':
                                        section_q_idx = new_idx
                                        if section_q_idx >= len(q_range):
                                            vi_phase = 'MCQ'
                                            section_q_idx = 0
                                    elif sec_key == 'VI_MCQ':
                                        section_q_idx = new_idx
                                elif sec_key.startswith(current_section):
                                    section_q_idx = new_idx
                                break
                continue
            
            # === No explicit number - use section context ===
            final_ans = ""
            assigned_q = None
            
            if current_section == 'III':
                # For section III, try highlight first, then mcq_start
                highlighted = find_highlighted_letter(para_obj)
                if highlighted:
                    q_range = section_q_map['III']
                    if section_q_idx < len(q_range):
                        assigned_q = q_range[section_q_idx]
                        final_ans = highlighted
                        section_q_idx += 1
                else:
                    m = mcq_start_pattern.match(text)
                    if m:
                        q_range = section_q_map['III']
                        if section_q_idx < len(q_range):
                            assigned_q = q_range[section_q_idx]
                            final_ans = m.group(1).upper()
                            section_q_idx += 1
            
            elif current_section == 'V':
                m = mcq_start_pattern.match(text)
                if m:
                    q_range = section_q_map['V']
                    if section_q_idx < len(q_range):
                        assigned_q = q_range[section_q_idx]
                        final_ans = m.group(1).upper()
                        section_q_idx += 1
            
            elif current_section == 'VI':
                m_tf = tf_pattern.search(text)
                m_mcq = mcq_start_pattern.match(text)
                
                if m_tf and vi_phase == 'TF':
                    q_range = section_q_map['VI_TF']
                    if section_q_idx < len(q_range):
                        assigned_q = q_range[section_q_idx]
                        val = m_tf.group(1).capitalize()
                        final_ans = 'False' if val == 'Fasle' else val
                        section_q_idx += 1
                        if section_q_idx >= len(q_range):
                            vi_phase = 'MCQ'
                            section_q_idx = 0
                elif m_mcq and vi_phase == 'MCQ':
                    q_range = section_q_map['VI_MCQ']
                    if section_q_idx < len(q_range):
                        assigned_q = q_range[section_q_idx]
                        final_ans = m_mcq.group(1).upper()
                        section_q_idx += 1
            
            elif current_section == 'VII':
                m = ans_keyword_pattern.search(text)
                if m:
                    q_range = section_q_map['VII']
                    if section_q_idx < len(q_range):
                        assigned_q = q_range[section_q_idx]
                        final_ans = m.group(1).strip()
                        if final_ans.endswith('.'): final_ans = final_ans[:-1].strip()
                        section_q_idx += 1
            
            elif current_section == 'VIII':
                for pat in [answer_english_pattern, ans_keyword_pattern]:
                    m = pat.match(text) if pat == answer_english_pattern else pat.search(text)
                    if m:
                        q_range = section_q_map['VIII']
                        if section_q_idx < len(q_range):
                            assigned_q = q_range[section_q_idx]
                            final_ans = m.group(1).strip()
                            if final_ans.endswith('.'): final_ans = final_ans[:-1].strip()
                            section_q_idx += 1
                        break
            
            elif current_section == 'IX':
                m = ans_keyword_pattern.search(text)
                if m:
                    q_range = section_q_map['IX']
                    if section_q_idx < len(q_range):
                        assigned_q = q_range[section_q_idx]
                        final_ans = m.group(1).strip()
                        if final_ans.endswith('.'): final_ans = final_ans[:-1].strip()
                        section_q_idx += 1
            
            if assigned_q and final_ans:
                answers[str(assigned_q)] = final_ans
        
        all_tests.append(answers)
    
    return all_tests

# === MAIN ===
file_path = r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx"
results = extract_all_tests(file_path)
print(f"\nTotal tests extracted: {len(results)}")

with open('extracted_keys.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

if results:
    print(f"\n--- Test 1 ({len(results[0])} answers) ---")
    print(json.dumps(results[0], indent=2, ensure_ascii=False))

print(f"\n--- Summary ---")
expected = set(range(1, 41))  # All 40 questions
complete = 0
for i, test in enumerate(results):
    qs = set(int(k) for k in test.keys())
    missing = sorted(expected - qs)
    count = len(qs & expected)
    status = f"MISSING: {missing}" if missing else "✓ Complete (40/40)"
    if not missing: complete += 1
    print(f"Test {i+1}: {count}/40 | {status}")
print(f"\n=== {complete}/{len(results)} tests complete ===")
