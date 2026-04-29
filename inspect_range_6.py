import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

def read_docx_range(file_path, start_line, end_line):
    doc = docx.Document(file_path)
    paras = [p.text for p in doc.paragraphs if p.text.strip()]
    for i in range(max(0, start_line), min(len(paras), end_line)):
        print(f"L{i}: |{paras[i]}|")

file_path = r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx"
# Look back from 3985 to find the start of the test
read_docx_range(file_path, 3900, 3985)
