import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

for test_num in [1, 2, 3]:
    pdf_path = f"public/pdfs/De_ThucHanh_{test_num}.pdf"
    print(f"\n{'='*80}")
    print(f"ĐỀ THỰC HÀNH {test_num}")
    print(f"{'='*80}")
    
    doc = fitz.open(pdf_path)
    for page_num in range(len(doc)):
        print(f"\n--- Trang {page_num + 1} ---")
        text = doc[page_num].get_text("text")
        print(text)
    doc.close()
