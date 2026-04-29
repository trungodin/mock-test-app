import docx
from docx.enum.text import WD_COLOR_INDEX
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

file_path = r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx"
doc = docx.Document(file_path)

# Look at the first few paragraphs with run-level formatting
paras_with_text = [(i, p) for i, p in enumerate(doc.paragraphs) if p.text.strip()]

for idx, (para_idx, para) in enumerate(paras_with_text[:15]):
    print(f"\n=== Paragraph {para_idx}: {para.text[:80]} ===")
    for run_idx, run in enumerate(para.runs):
        text = run.text
        if not text.strip():
            continue
        bold = run.bold
        font_color = None
        highlight = None
        try:
            if run.font.color and run.font.color.rgb:
                font_color = str(run.font.color.rgb)
        except:
            pass
        try:
            highlight = run.font.highlight_color
        except:
            pass
        
        print(f"  Run {run_idx}: text=|{text}| bold={bold} color={font_color} highlight={highlight}")
