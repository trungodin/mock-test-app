import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx"
doc = docx.Document(file_path)
paras = [p.text for p in doc.paragraphs if p.text.strip()]

# Find all TỔNG KẾT markers and print surrounding context
import re
end_pattern = re.compile(r'TỔNG KẾT', re.IGNORECASE)
markers = []
for i, p in enumerate(paras):
    if end_pattern.search(p):
        markers.append(i)

print(f"Total markers: {len(markers)}")

# Check the gap between markers to see the structure
for idx in range(len(markers)):
    start = markers[idx]
    end = markers[idx+1] if idx+1 < len(markers) else len(paras)
    lines = end - start
    print(f"Test {idx+1}: Lines {start}-{end} ({lines} lines)")
