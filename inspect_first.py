import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

def print_first_paras(file_path):
    doc = docx.Document(file_path)
    for i, p in enumerate(doc.paragraphs):
        if i > 300: break
        text = p.text.strip()
        if text:
            print(f"L{i}: {text}")

print_first_paras(r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx")
