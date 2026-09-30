"""Turn results/chart.json into a readable results page (RESULTS.md)."""
import json
from pathlib import Path

ROOT = Path(__file__).parent
CHART = ROOT / "results" / "chart.json"
OUT = ROOT / "RESULTS.md"

SUN = {
    "Pisces": "Intuitive, imaginative and deeply empathetic. You absorb the moods around you, "
              "feel things fully, and are drawn to art, music and anything that lets you escape into another world.",
}
MOON = {
    "Gemini": "Your emotions run through your mind: you process feelings by talking, writing and "
              "staying curious. You need variety and conversation to feel settled.",
}
RISING = {
    "Taurus": "People first see you as calm, grounded and steady, with an eye for beauty and comfort. "
              "You take your time and don't like being rushed.",
}
HIGHLIGHTS = [
    "**Jupiter in Scorpio in the 7th house**: deep, all-in partnerships and fierce loyalty.",
    "**Sun, Mercury and Uranus in the 11th house**: life revolves around friends, groups and community.",
    "**Venus and Neptune in the 10th house**: charm and imagination in public life and career.",
    "**Mercury, Jupiter and Saturn were all retrograde at birth**: an inward, reflective thinker who re-examines ideas.",
    "**Saturn in Leo in the 4th house**: works hard for recognition and a stable home base.",
]


def table(rows, cols):
    head = "| " + " | ".join(c for c, _ in cols) + " |\n|" + "---|" * len(cols) + "\n"
    body = ""
    for r in rows:
        body += "| " + " | ".join(fmt(r, k) for _, k in cols) + " |\n"
    return head + body


def fmt(row, key):
    if key == "degree":
        return f"{row['degree']}°" if "degree" in row else "—"
    if key == "retrograde":
        return "℞" if row["retrograde"] else ""
    return str(row[key])


def build():
    w = json.loads(CHART.read_text())
    md = f"""# ✨ My Astrology Results

Born in **{w['place']}**. Western (tropical) chart. Chart computed with the Swiss Ephemeris.

> 🔒 Birth time is kept private. The rising sign is shown by sign only and the Moon without its degree,
> so the exact time can't be worked out from this page.

## The Big Three

| | Sign | |
|---|---|---|
| ☀️ Sun | **{w['sun_sign']}** | {SUN.get(w['sun_sign'], '')} |
| 🌙 Moon | **{w['moon_sign']}** | {MOON.get(w['moon_sign'], '')} |
| ⬆️ Rising | **{w['rising_sign']}** | {RISING.get(w['rising_sign'], '')} |

## Planet positions (Porphyry houses)

{table(w['planets'], [('Planet', 'planet'), ('Sign', 'sign'), ('Degree', 'degree'), ('House', 'house'), ('Retro', 'retrograde')])}
## Highlights

""" + "\n".join(f"- {h}" for h in HIGHLIGHTS) + """

---
*For fun and self-reflection, not a prediction of the future.*
"""
    OUT.write_text(md)


if __name__ == "__main__":
    build()
    print(f"Wrote {OUT.name}")
