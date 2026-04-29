import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

def count_markers(file_path):
    doc = docx.Document(file_path)
    count = 0
    for i, p in enumerate(doc.paragraphs):
        if "TỔNG KẾT" in p.text.upper():
            count += 1
            print(f"L{i}: {p.text}")
    print(f"Total TỔNG KẾT markers: {count}")

count_markers(r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx")
