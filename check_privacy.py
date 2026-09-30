"""Fail if the private birth time appears in any file that would be committed."""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent
private = json.loads((ROOT / "birth_data.local.json").read_text())
hh, mm = private["time"].split(":")
h = int(hh)
patterns = [rf"\b0?{h}\s*[:.hH]\s*{mm}\b", rf"\b{hh}{mm}\b"]
if h > 12:
    patterns.append(rf"\b{h - 12}\s*[:.]\s*{mm}\b")

files = subprocess.run(["git", "ls-files", "--cached", "--others", "--exclude-standard"],
                       cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()
leaks = [f for f in files if f != "check_privacy.py"
         and any(re.search(p, (ROOT / f).read_text(errors="ignore")) for p in patterns)]
if leaks:
    sys.exit(f"Birth time found in: {', '.join(leaks)}")
print(f"OK - birth time not present in {len(files)} tracked files")
