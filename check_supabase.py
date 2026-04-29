import json
import sys
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://soxrkxyswakctxrltzik.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNveHJreHlzd2FrY3R4cmx0emlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTU1MjQsImV4cCI6MjA5MjU3MTUyNH0.nXIb9OdZzuyOCFn9PhCY9JdwcGEU68smtyF3sY3KR70"

def query_supabase(table, select="*", order=None, limit=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}?select={select}"
    if order:
        url += f"&order={order}"
    if limit:
        url += f"&limit={limit}"
    
    req = urllib.request.Request(url)
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            return data
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode()}")
        return None

# 1. Check answer_keys table
print("=== answer_keys table ===")
data = query_supabase("answer_keys", select="testId,updatedAt", order="testId.asc")
if data:
    print(f"Total rows: {len(data)}")
    for row in data:
        print(f"  testId: {row['testId']}, updatedAt: {row.get('updatedAt', 'N/A')}")
else:
    print("No data or table doesn't exist")

# 2. Check a sample answer key to see format
print("\n=== Sample answer key (first row) ===")
sample = query_supabase("answer_keys", select="*", limit=1)
if sample and len(sample) > 0:
    row = sample[0]
    print(f"testId: {row['testId']}")
    answers = row.get('answers', {})
    if isinstance(answers, str):
        answers = json.loads(answers)
    print(f"Number of answers: {len(answers)}")
    print(f"Answer keys: {list(answers.keys())[:10]}...")
    print(f"Sample answers: {json.dumps(dict(list(answers.items())[:5]), ensure_ascii=False)}")
