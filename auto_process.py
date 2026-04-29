import fitz  # PyMuPDF
import json
import os
import sys
import codecs

sys.stdout.reconfigure(encoding='utf-8')

def main():
    # 1. Đường dẫn file PDF bự
    pdf_path = "75+ Đề thi tiếng anh vào 10 HCM 2026.pdf"
    output_pdf_dir = "public/pdfs"
    output_json_path = "public/data/tests_new.json"

    if not os.path.exists(pdf_path):
        print(f"LỖI: Không tìm thấy file '{pdf_path}'. Vui lòng lưu file Word thành PDF và đặt tên là '{pdf_path}' để chung thư mục với script này.")
        sys.exit(1)

    if not os.path.exists(output_pdf_dir):
        os.makedirs(output_pdf_dir)

    print(f"Đang đọc file PDF: {pdf_path}...")
    doc = fitz.open(pdf_path)
    
    start_pages = []

    # 2. Quét tìm trang bắt đầu của mỗi đề
    print("Đang quét để tìm các đề...")
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text("text").lower()
        # Tìm từ khóa nhận diện đề mới. Trong file word là "Họ và tên học sinh:"
        if "họ và tên học sinh:" in text or "họ và tên" in text:
            start_pages.append(page_num)

    # Loại bỏ các trang trùng lặp nếu text xuất hiện nhiều lần trên 1 trang
    start_pages = sorted(list(set(start_pages)))

    if not start_pages:
        print("LỖI: Không tìm thấy từ khóa 'Họ và tên học sinh:' nào trong file PDF. Không thể tách đề.")
        sys.exit(1)

    num_tests = len(start_pages)
    print(f"🎉 Đã tìm thấy {num_tests} đề thi!")

    # 3. Cắt PDF và Sinh JSON
    tests_data = []

    for i in range(num_tests):
        start = start_pages[i]
        # Đề kết thúc ở trang ngay trước trang bắt đầu của đề tiếp theo
        end = start_pages[i+1] - 1 if i + 1 < num_tests else len(doc) - 1
        
        test_id = str(i + 1)
        filename = f"De_ThucHanh_{test_id}.pdf"
        output_filepath = os.path.join(output_pdf_dir, filename)

        # Cắt PDF
        new_doc = fitz.open()
        new_doc.insert_pdf(doc, from_page=start, to_page=end)
        new_doc.save(output_filepath)
        new_doc.close()
        
        print(f"Đã cắt và lưu: {filename} (từ trang {start + 1} đến {end + 1})")

        # Tạo Khung JSON 40 câu
        questions = []
        for q_num in range(1, 41):
            q_id = str(q_num)
            if q_num <= 28:
                # Trắc nghiệm
                questions.append({
                    "id": q_id,
                    "prompt": f"Câu {q_id}",
                    "type": "mcq",
                    "options": {
                        "A": "Đáp án A",
                        "B": "Đáp án B",
                        "C": "Đáp án C",
                        "D": "Đáp án D"
                    },
                    "answer": "A" # Đáp án ảo, sẽ được Admin sửa lại sau
                })
            else:
                # Tự luận (Điền từ, Viết lại câu)
                questions.append({
                    "id": q_id,
                    "prompt": f"Câu {q_id}",
                    "type": "text",
                    "answer": ""
                })

        tests_data.append({
            "id": f"new_test_{test_id}",
            "title": f"Đề Thực Hành {test_id} (New)",
            "filename": filename,
            "timeLimit": 60,
            "questionCount": 40,
            "questions": questions
        })

    # Lưu file JSON
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(tests_data, f, ensure_ascii=False, indent=2)

    print(f"✅ HOÀN TẤT! Đã sinh xong 75 file PDF và tạo khung JSON tại {output_json_path}")
    print("Vui lòng vào file src/app/page.tsx và import tests_new.json để hiển thị lên web.")

if __name__ == "__main__":
    main()
