import docx
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def extract_answers_from_docx(file_path):
    doc = docx.Document(file_path)
    
    all_tests = []
    current_test_answers = {}
    current_test_num = 1
    
    q_pattern = re.compile(r'^(\d+)\.\s*(.*)', re.IGNORECASE)
    tf_pattern = re.compile(r'\b(TRUE|FALSE)\b', re.IGNORECASE)
    mcq_pattern = re.compile(r'\b([A-D])\b', re.IGNORECASE)
    
    # Very loose pattern to catch "Đáp án:" or similar
    # It looks for anything ending in "án" or "an" followed by a colon
    ans_keyword_pattern = re.compile(r'.*[áa]n\s*:\s*(.*)', re.IGNORECASE)

    last_q_num = 0
    paras = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    
    i = 0
    while i < len(paras):
        text = paras[i]
        match = q_pattern.match(text)
        
        if match:
            q_num_str = match.group(1)
            q_num = int(q_num_str)
            remainder = match.group(2).strip()
            
            if q_num < last_q_num and len(current_test_answers) > 10:
                all_tests.append({
                    "test_id": f"new_test_{current_test_num}",
                    "answers": current_test_answers
                })
                current_test_answers = {}
                current_test_num += 1
            
            last_q_num = q_num
            final_ans = ""
            
            if 1 <= q_num <= 22 or 27 <= q_num <= 28:
                m = mcq_pattern.search(remainder)
                if m: final_ans = m.group(1).upper()
            elif 23 <= q_num <= 26:
                m = tf_pattern.search(remainder)
                if m: final_ans = m.group(1).capitalize()
            else:
                found_ans = False
                # Check current line for "án:"
                ans_match = ans_keyword_pattern.search(remainder)
                if ans_match:
                    final_ans = ans_match.group(1).strip()
                    found_ans = True
                else:
                    # Look ahead up to 15 lines
                    for j in range(1, 15):
                        if i + j < len(paras):
                            next_text = paras[i+j]
                            if q_pattern.match(next_text):
                                break
                            ans_match = ans_keyword_pattern.search(next_text)
                            if ans_match:
                                final_ans = ans_match.group(1).strip()
                                found_ans = True
                                break
                
                if not found_ans:
                    # Look for arrow
                    if remainder.startswith('→'):
                        final_ans = remainder[1:].strip()
                    elif i + 1 < len(paras) and paras[i+1].startswith('→'):
                        final_ans = paras[i+1][1:].strip()
                    else:
                        final_ans = remainder
            
            if final_ans:
                if q_num >= 29 and final_ans.endswith('.'):
                    final_ans = final_ans[:-1].strip()
                current_test_answers[str(q_num)] = final_ans
        
        i += 1

    if current_test_answers:
        all_tests.append({
            "test_id": f"new_test_{current_test_num}",
            "answers": current_test_answers
        })
        
    return all_tests

file_path = r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx"
try:
    all_extracted_tests = extract_answers_from_docx(file_path)
    if all_extracted_tests:
        first_test = all_extracted_tests[0]
        print(f"--- Kết quả trích xuất Đề 1 (Thử nghiệm với regex lỏng) ---")
        print(json.dumps(first_test['answers'], indent=2, ensure_ascii=False))
        print(f"\nTìm thấy tổng cộng {len(all_extracted_tests)} đề.")
except Exception as e:
    print(f"Error: {e}")
