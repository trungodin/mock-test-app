import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = "75+ Đề thi tiếng anh vào 10 HCM 2026.pdf"
doc = fitz.open(pdf_path)

c1 = 0
c2 = 0
start_pages = set()

for i in range(len(doc)):
    text = doc[i].get_text("text").lower()
    if "họ và tên" in text:
        c1 += 1
        start_pages.add(i)
    if "choose the word" in text and "pronounced differently" in text:
        c2 += 1
        start_pages.add(i)

print(f"Pages with 'họ và tên': {c1}")
print(f"Pages with 'choose the word...': {c2}")
print(f"Unique start pages: {len(start_pages)}")
