import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

def read_docx(file_path):
    doc = docx.Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return '\n'.join(full_text)

file_path = r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx"
try:
    content = read_docx(file_path)
    # Search for "Đề" markers
    print("Searching for test markers...")
    import re
    # Find positions of "ĐỀ" or "Đề" followed by a number
    matches = list(re.finditer(r'─Éß╗Ç\s+\d+|─Éß╗Ç\s+Sß╗É\s+\d+|─Éß╗Ç\s+Sß╗Æ\s+\d+', content, re.IGNORECASE))
    # Wait, the encoding might be weird again if I use content directly from docx.
    # Actually, let's just print the first 10000 characters and look manually for the test headers.
    print(content[:10000])
except Exception as e:
    print(f"Error: {e}")
