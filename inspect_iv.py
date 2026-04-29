import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx"
doc = docx.Document(file_path)
paras = [p.text for p in doc.paragraphs if p.text.strip()]

# Find all "IV" section headers and print the answers after them
iv_pattern = __import__('re').compile(r'^IV\.?\s+Choose.*(?:picture|sign)', __import__('re').IGNORECASE)
for i, p in enumerate(paras):
    if iv_pattern.search(p):
        print(f"\n=== IV at L{i} ===")
        for j in range(i+1, min(i+20, len(paras))):
            print(f"  L{j}: |{paras[j]}|")
        if i > 4265:  # Only show a few examples
            break
