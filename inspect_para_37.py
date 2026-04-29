import docx
import sys

sys.stdout.reconfigure(encoding='utf-8')

def read_docx(file_path):
    doc = docx.Document(file_path)
    paras = [p.text for p in doc.paragraphs if p.text.strip()]
    return paras

file_path = r"C:\Users\CNBT\Desktop\Đề anh văn lớp 10\KEY 75+  Đề thi tiếng anh vào 10 HCM 2026.docx"
try:
    paras = read_docx(file_path)
    # Find Q37
    for i, p in enumerate(paras):
        if p.startswith("37."):
            print(f"Para {i}: |{p}|")
            print(f"Para {i+1}: |{paras[i+1]}|")
            print(f"Para {i+2}: |{paras[i+2]}|")
            print(f"Para {i+3}: |{paras[i+3]}|")
            print(f"Para {i+4}: |{paras[i+4]}|")
            break
except Exception as e:
    print(f"Error: {e}")
