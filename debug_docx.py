import docx
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def debug_tests(file_path):
    doc = docx.Document(file_path)
    paras = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    
    q_pattern = re.compile(r'^(\d+)\.\s*(.*)', re.IGNORECASE)
    
    test_starts = []
    last_q_num = 0
    q_count = 0
    
    for i, text in enumerate(paras):
        match = q_pattern.match(text)
        if match:
            q_num = int(match.group(1))
            if q_num < last_q_num and q_count > 10:
                test_starts.append(i)
                q_count = 0
            last_q_num = q_num
            q_count += 1
            
    print(f"Found {len(test_starts) + 1} tests.")
    
    # Print lines around the end to see why it stops at 73
    print("\n--- Last detected test start lines ---")
    for start_idx in test_starts:
        print(f"Line {start_idx}: {paras[start_idx][:50]}...")

debug_tests(r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx")
