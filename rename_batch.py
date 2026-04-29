import os
import json

pdf_dir = "public/pdfs"
json_path = "public/data/tests_native.json"

# 1. Rename PDFs (from 78 down to 41)
print("Renaming PDFs...")
for i in range(78, 40, -1):
    old_name = f"De_ThucHanh_{i}.pdf"
    new_name = f"De_ThucHanh_{i+2}.pdf"
    
    old_path = os.path.join(pdf_dir, old_name)
    new_path = os.path.join(pdf_dir, new_name)
    
    if os.path.exists(old_path):
        os.rename(old_path, new_path)
        print(f"Renamed {old_name} -> {new_name}")

# 2. Update JSON
print("\nUpdating JSON...")
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for test in data:
    if test.get("filename", "").startswith("De_ThucHanh_"):
        # Extract number
        try:
            num = int(test["filename"].split("_")[2].split(".")[0])
            if 41 <= num <= 78:
                new_num = num + 2
                test["filename"] = f"De_ThucHanh_{new_num}.pdf"
                test["title"] = f"Đề Thực Hành {new_num} (New)"
                test["id"] = f"new_test_{new_num}"
                print(f"Updated JSON for test {num} -> {new_num}")
        except:
            pass

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Done!")
