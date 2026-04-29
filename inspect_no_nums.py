import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx"
doc = docx.Document(file_path)
paras = [p.text for p in doc.paragraphs if p.text.strip()]

# Check from Test 29 area onward - around line 4238
print("=== Test that starts after 4237 (no question numbers for 1-16) ===")
for i in range(4238, 4310):
    if i < len(paras):
        print(f"L{i}: |{paras[i]}|")
