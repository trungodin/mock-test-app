import json
import sys
import urllib.request
import urllib.error
import time

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://soxrkxyswakctxrltzik.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNveHJreHlzd2FrY3R4cmx0emlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTU1MjQsImV4cCI6MjA5MjU3MTUyNH0.nXIb9OdZzuyOCFn9PhCY9JdwcGEU68smtyF3sY3KR70"

# === 1. BUILD MAPPING: extracted_keys index → test ID ===
# App has 78 tests: new_test_1 to new_test_40, new_test_43 to new_test_80
app_test_ids = []
for i in range(1, 41):   # 1-40
    app_test_ids.append(f"new_test_{i}")
for i in range(43, 81):  # 43-80
    app_test_ids.append(f"new_test_{i}")

print(f"App test IDs: {len(app_test_ids)} tests")
print(f"First 5: {app_test_ids[:5]}")
print(f"After 40: {app_test_ids[40:43]}")

# === 2. LOAD EXTRACTED KEYS ===
with open('extracted_keys.json', 'r', encoding='utf-8') as f:
    extracted = json.load(f)

print(f"\nExtracted keys: {len(extracted)} tests")

# === 3. VERIFY MAPPING ===
# extracted[0] = new_test_1, extracted[1] = new_test_2, etc.
# Already uploaded: new_test_1 to new_test_5 (index 0-4)
# Need to upload: index 5 to 73 → new_test_6 to new_test_74 (mapped via app_test_ids)

# Verify: new_test_5 (index 4) should match what's already on Supabase
print("\n=== VERIFICATION: new_test_5 (index 4) ===")
print(f"Extracted Q1={extracted[4].get('1')}, Q2={extracted[4].get('2')}, Q3={extracted[4].get('3')}")
print("Should match Supabase: Q1=D, Q2=B, Q3=B (from earlier check)")

# === 4. UPLOAD ===
def upsert_answer_key(test_id, answers):
    url = f"{SUPABASE_URL}/rest/v1/answer_keys"
    payload = json.dumps({
        "testId": test_id,
        "answers": answers,
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%S.000+00:00")
    }).encode()
    
    req = urllib.request.Request(url, data=payload, method='POST')
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "resolution=merge-duplicates")
    
    try:
        with urllib.request.urlopen(req) as resp:
            return True, resp.status
    except urllib.error.HTTPError as e:
        return False, f"HTTP {e.code}: {e.read().decode()}"

# Clean answers: remove explanation text in parentheses for cleaner storage
def clean_answer(val):
    """Remove Vietnamese explanations in parentheses, trailing periods, etc."""
    if not val:
        return val
    # Remove trailing period
    val = val.rstrip('.')
    # Remove content in parentheses like "(song ngữ)" or ("make a speech": phát biểu)
    import re
    # Remove (...) at end
    val = re.sub(r'\s*\(.*?\)\s*$', '', val)
    # Remove ("...") patterns
    val = re.sub(r'\s*\(".*?"\)\s*$', '', val)
    return val.strip()

# Upload index 5 to min(73, len(extracted)-1)
max_index = min(len(extracted), len(app_test_ids))
uploaded = 0
skipped = 0
failed = 0

print(f"\n=== UPLOADING new_test_6 to new_test_{app_test_ids[max_index-1].split('_')[-1]} ===")
print(f"Index range: 5 to {max_index - 1}")

for idx in range(5, max_index):
    test_id = app_test_ids[idx]
    answers = extracted[idx]
    
    # Clean answers
    cleaned = {}
    for k, v in answers.items():
        cleaned[k] = clean_answer(v)
    
    num_answers = len(cleaned)
    
    if num_answers < 20:
        print(f"  ⚠️ SKIP {test_id} (index {idx}): only {num_answers} answers - too few, likely parsing error")
        skipped += 1
        continue
    
    success, status = upsert_answer_key(test_id, cleaned)
    if success:
        print(f"  ✅ {test_id} (index {idx}): {num_answers}/40 answers uploaded")
        uploaded += 1
    else:
        print(f"  ❌ {test_id} (index {idx}): FAILED - {status}")
        failed += 1
    
    time.sleep(0.1)  # Rate limiting

print(f"\n=== SUMMARY ===")
print(f"Uploaded: {uploaded}")
print(f"Skipped: {skipped}")
print(f"Failed: {failed}")
print(f"Already on Supabase: 5 (new_test_1 to new_test_5)")
print(f"Total covered: {uploaded + 5} / 78")
