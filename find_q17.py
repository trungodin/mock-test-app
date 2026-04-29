import docx
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

file_path = r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx"
doc = docx.Document(file_path)
paras = [p.text for p in doc.paragraphs if p.text.strip()]

# Find lines containing "17" in the answer context
p17 = re.compile(r'1[\.:]\s+17[\.:]\s+', re.IGNORECASE)
for i, p in enumerate(paras):
    if p17.search(p):
        print(f"L{i}: |{p}|")
        
print("\n=== Also check for lines with just '17.' ===")
p17b = re.compile(r'^17[\.:]\s+', re.IGNORECASE)
count = 0
for i, p in enumerate(paras):
    if p17b.match(p):
        print(f"L{i}: |{p[:80]}|")
        count += 1
        if count > 10: break
