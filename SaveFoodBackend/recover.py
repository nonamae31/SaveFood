import json

path = r'C:\Users\Admin\.gemini\antigravity\brain\b3b92be9-1570-4734-8d7b-4ef08476c8a3\.system_generated\logs\transcript_full.jsonl'
target = r'C:\Users\Admin\.gemini\antigravity\brain\b3b92be9-1570-4734-8d7b-4ef08476c8a3\implementation_plan.md'

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

line = json.loads(lines[1219])
content = line['tool_calls'][0]['args']['CodeContent']

with open(target, 'w', encoding='utf-8') as f:
    f.write(content)
