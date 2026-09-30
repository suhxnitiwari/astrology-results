"""Block a commit if any tracked file leaks the birth time or says anything negative about me.

Both lists live in gitignored local files (birth_data.local.json, content_guard.local.txt),
so the guard itself never publishes what it protects.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent
private = json.loads((ROOT / "birth_data.local.json").read_text())
hh, mm = private["time"].split(":")
h = int(hh)
time_patterns = [rf"\b0?{h}\s*[:.hH]\s*{mm}\b", rf"\b{hh}{mm}\b"]
guard = ROOT / "content_guard.local.txt"
blocked = [w.strip().lower() for w in guard.read_text().splitlines() if w.strip()] if guard.exists() else []

files = subprocess.run(["git", "ls-files", "--cached", "--others", "--exclude-standard"],
                       cwd=ROOT, capture_output=True, text=True, check=True).stdout.splitlines()
problems = []
for f in files:
    text = (ROOT / f).read_text(errors="ignore")
    if any(re.search(p, text) for p in time_patterns):
        problems.append(f"{f}: birth time")
    low = text.lower()
    hits = sorted({w for w in blocked if w in low})
    if hits:
        problems.append(f"{f}: blocked words {hits}")
if problems:
    sys.exit("Commit blocked:\n  " + "\n  ".join(problems))
print(f"OK - no birth time or blocked words in {len(files)} files")
