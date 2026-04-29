import json
import sys
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://soxrkxyswakctxrltzik.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNveHJreHlzd2FrY3R4cmx0emlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTU1MjQsImV4cCI6MjA5MjU3MTUyNH0.nXIb9OdZzuyOCFn9PhCY9JdwcGEU68smtyF3sY3KR70"

def query_supabase(table, select="*", filter_str=""):
    url = f"{SUPABASE_URL}/rest/v1/{table}?select={select}{filter_str}"
    req = urllib.request.Request(url)
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

# Show format of old test (testId=1) vs new test (new_test_1)
for tid in ['1', 'new_test_1', 'new_test_5']:
    data = query_supabase("answer_keys", filter_str=f"&testId=eq.{tid}")
    if data:
        row = data[0]
        ans = row['answers']
        if isinstance(ans, str): ans = json.loads(ans)
        print(f"\n=== testId: {tid} ({len(ans)} answers) ===")
        for k, v in sorted(ans.items(), key=lambda x: float(x[0]) if '.' not in x[0] else float(x[0])):
            print(f"  {k}: {v}")
