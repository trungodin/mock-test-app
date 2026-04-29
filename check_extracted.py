import json
import sys

def check_keys():
    with open('extracted_keys.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Extracted {len(data)} tests.")
    for i, test in enumerate(data):
        qs = sorted([int(k) for k in test.keys()])
        if qs:
            print(f"Test {i+1}: Questions {qs[0]} to {qs[-1]} (Total {len(qs)})")
        else:
            print(f"Test {i+1}: Empty!")

check_keys()
