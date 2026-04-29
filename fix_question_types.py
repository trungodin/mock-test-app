import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

json_path = "public/data/tests_native.json"

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

updated_count = 0

for test in data:
    if not test.get("id", "").startswith("new_test_"):
        continue
    
    # Rebuild proper question structure for new tests
    questions = []
    for i in range(1, 41):
        q_id = str(i)
        
        if 1 <= i <= 22 or 27 <= i <= 28:
            # MCQ: A, B, C, D
            questions.append({
                "id": q_id,
                "label": str(i),
                "prompt": f"Câu {i}",
                "type": "mcq_abcd",
                "answer": "A"
            })
        elif 23 <= i <= 26:
            # True / False
            questions.append({
                "id": q_id,
                "label": str(i),
                "prompt": f"Câu {i}",
                "type": "true_false",
                "answer": "True"
            })
        elif 29 <= i <= 36:
            # Word form / Dictionary - text input
            questions.append({
                "id": q_id,
                "label": str(i),
                "prompt": f"Câu {i}",
                "type": "text",
                "answer": ""
            })
        elif 37 <= i <= 40:
            # Sentence rewrite - text input
            questions.append({
                "id": q_id,
                "label": str(i),
                "prompt": f"Câu {i}",
                "type": "text",
                "answer": ""
            })
    
    test["questions"] = questions
    updated_count += 1

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Updated {updated_count} tests with correct question types.")
