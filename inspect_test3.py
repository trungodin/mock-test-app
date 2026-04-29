import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx"
doc = docx.Document(file_path)
paras = [p.text for p in doc.paragraphs if p.text.strip()]

# Test 3 starts at line 303, ends at 394 (from earlier map_tests output)
print("=== Test 3 area (lines 340-394) ===")
for i in range(340, 394):
    if i < len(paras):
        print(f"L{i}: |{paras[i]}|")
