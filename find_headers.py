import docx
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def find_headers(file_path):
    doc = docx.Document(file_path)
    # Match "ĐỀ THỰC HÀNH X" or "ĐỀ SỐ X" or "ĐỀ X"
    header_pattern = re.compile(r'(?:[DĐ]├Ç|[DĐ]ß╗Ç|[DĐ]─É)\s*(?:THß╗░C\s+H├ÇNH|Sß╗É|Sß╗Æ|THUC\s+HANH)?\s*(\d+)', re.IGNORECASE)
    
    for i, para in enumerate(doc.paragraphs):
        text = para.text.strip()
        if not text: continue
        match = header_pattern.match(text)
        if match:
            print(f"Line {i}: {text} (Test {match.group(1)})")

find_headers(r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx")
