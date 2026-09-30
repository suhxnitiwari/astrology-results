"""Bonus experiment: if my personality strengths alone picked a zodiac sign.

Each sign lists the strengths astrology says it gives. Its match score is the average
of my scores for those strengths. Only strengths I score highly on (60+) are published as highlights.
Writes results/personality_match.json.
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent
TRAITS = json.loads((ROOT / "data" / "personality.json").read_text())["traits"]
OUT = ROOT / "results" / "personality_match.json"
SHOW_AT = 60

SIGNS = [
    ("Aries", "♈", "confidence leadership independence ambition"),
    ("Taurus", "♉", "stability loyalty tradition"),
    ("Gemini", "♊", "curiosity communication sociability"),
    ("Cancer", "♋", "warmth empathy loyalty stability tradition"),
    ("Leo", "♌", "confidence leadership warmth creativity ambition"),
    ("Virgo", "♍", "organized kindness curiosity honesty"),
    ("Libra", "♎", "warmth sociability creativity"),
    ("Scorpio", "♏", "loyalty confidence ambition honesty"),
    ("Sagittarius", "♐", "independence curiosity spirituality"),
    ("Capricorn", "♑", "ambition organized tradition stability"),
    ("Aquarius", "♒", "independence curiosity creativity"),
    ("Pisces", "♓", "empathy spirituality kindness creativity"),
]


def score(spec):
    keys = spec.split()
    pct = round(sum(TRAITS[k]["score"] for k in keys) / len(keys))
    shown = [{"trait": TRAITS[k]["label"], "evidence": TRAITS[k]["evidence"]}
             for k in sorted(keys, key=lambda k: -TRAITS[k]["score"]) if TRAITS[k]["score"] >= SHOW_AT]
    return pct, shown


def rank(items, fields):
    out = []
    for item in items:
        pct, strengths = score(item[-1])
        out.append({**dict(zip(fields, item[:-1])), "match": pct, "strengths": strengths})
    return sorted(out, key=lambda r: -r["match"])


def build():
    result = {
        "method": "Average of my strength scores for the qualities astrology links to each sign (0-100).",
        "signs": rank(SIGNS, ["name", "glyph"]),
    }
    OUT.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    return result


if __name__ == "__main__":
    r = build()
    print("  ".join(f"{s['name']} {s['match']}" for s in r["signs"]))
