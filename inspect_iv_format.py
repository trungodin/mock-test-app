import docx
from docx.enum.text import WD_COLOR_INDEX
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx"
doc = docx.Document(file_path)
paras_with_text = [(i, p) for i, p in enumerate(doc.paragraphs) if p.text.strip()]

# Find section IV headers and print paragraphs after with highlight info
import re
iv_re = re.compile(r'^IV\.?\s+Choose.*(?:picture|sign)', re.IGNORECASE)

count = 0
for idx, (pi, para) in enumerate(paras_with_text):
    if iv_re.search(para.text):
        count += 1
        if count > 3: break
        print(f"\n=== IV at para {pi} (test ~{count}) ===")
        # Print next 15 paragraphs with run formatting
        for j in range(1, 15):
            if idx + j < len(paras_with_text):
                next_pi, next_para = paras_with_text[idx + j]
                text = next_para.text.strip()
                highlighted = None
                for run in next_para.runs:
                    try:
                        if run.font.highlight_color == WD_COLOR_INDEX.YELLOW:
                            highlighted = run.text.strip()
                    except:
                        pass
                h_info = f" [HIGHLIGHT: {highlighted}]" if highlighted else ""
                print(f"  L{next_pi}: |{text[:80]}|{h_info}")
