import re, sys
sys.stdout.reconfigure(encoding='utf-8')

# Test regex
ans_keyword_pattern = re.compile(r'(?:^|\s)[Đđ][áa]p\s*[áa]n\s*:\s*(.*)', re.IGNORECASE)

tests = [
    "Đáp án: developing.",
    "Đáp án: limitations/limits",
    "29.\tDấu hiệu: sau giới từ + Ving",
    "30.\tDấu hiệu: trước chỗ trống là sở hữu cách",
    "Đáp án: Advertising/ Advertisement",
    "Đáp án: bilingual (song ngữ).",
    "Đáp án là câu D.",
    "đáp án: interesting",
]

for t in tests:
    m = ans_keyword_pattern.search(t)
    print(f"|{t[:60]}| → {'MATCH: ' + m.group(1) if m else 'NO MATCH'}")
