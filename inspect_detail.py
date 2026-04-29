import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx"
doc = docx.Document(file_path)
paras = [p.text for p in doc.paragraphs if p.text.strip()]

# Find lines with "1.\t17" pattern
print("=== Lines containing '17' near question context ===")
for i, p in enumerate(paras):
    if '17' in p and i < 200:  # First test only
        print(f"L{i}: |{p}|")

print("\n=== Lines around 3910 (where test boundary issue starts) ===")
for i in range(3905, 3960):
    if i < len(paras):
        print(f"L{i}: |{paras[i]}|")

# Check format after TỔNG KẾT for tests that only have Q35-40
print("\n=== Area around line 4155 (end of test that becomes Q35-40 only) ===")
for i in range(4150, 4270):
    if i < len(paras):
        print(f"L{i}: |{paras[i]}|")
