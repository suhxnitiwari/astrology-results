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
LAGNA = {
    "Aries": "Mesha lagna, ruled by Mars: bold, energetic and quick to start things. You lead from the front "
             "and do best when you have a clear goal to chase.",
}
MOON_RASHI = {
    "Vrishabha": "The Moon is exalted in Vrishabha, one of its strongest placements. It gives emotional "
                 "stability, loyalty, a love of comfort and good food, and a naturally soothing presence.",
}
NAKSHATRA = {
    "Rohini": "Rohini is the Moon's favourite nakshatra, ruled by the Moon itself and symbolised by a chariot. "
              "It is linked with charm, creativity, beauty, growth and a magnetic personality.",
}
DASHA = {
    ("Rahu", "Saturn"): "Rahu Mahadasha with Saturn Antardasha: a period of ambition and unconventional "
                        "paths, with Saturn asking for discipline, patience and steady effort. Hard work now "
                        "builds foundations that last.",
}
HIGHLIGHTS = [
    "**Moon + Mars together in the 2nd house (Vedic)**: forms *Chandra-Mangal yoga*, traditionally tied to "
    "earning ability, determination and a strong voice.",
    "**Jupiter in the 7th house**: a classic placement for supportive partnerships and a wise, generous spouse.",
    "**Venus in the 10th house**: grace and charm in public life; success in creative, design or people-facing careers.",
    "**Mercury, Jupiter and Saturn were all retrograde at birth**: an inward, reflective thinker who re-examines "
    "ideas and learns best by revisiting them.",
    "**Sun in the 11th house**: gains through networks, friends and communities; ambitions that come true with age.",
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
    c = json.loads(CHART.read_text())
    w, v = c["western"], c["vedic"]
    md = f"""# ✨ My Astrology Results

Born in **{c['place']}**. Chart computed with the Swiss Ephemeris.

> 🔒 Birth time is kept private. The Ascendant is shown by sign only and the Moon without its degree,
> so the exact time can't be worked out from this page.

## The Big Three (Western, tropical)

| | Sign | |
|---|---|---|
| ☀️ Sun | **{w['sun_sign']}** | {SUN.get(w['sun_sign'], '')} |
| 🌙 Moon | **{w['moon_sign']}** | {MOON.get(w['moon_sign'], '')} |
| ⬆️ Rising | **{w['rising_sign']}** | {RISING.get(w['rising_sign'], '')} |

## Vedic Kundli (sidereal, {v['ayanamsa']} ayanamsa)

| | Result | |
|---|---|---|
| Lagna | **{v['lagna_rashi']}** ({v['lagna']}) | {LAGNA.get(v['lagna'], '')} |
| Rashi (Moon sign) | **{v['moon_rashi']}** ({v['moon_sign']}) | {MOON_RASHI.get(v['moon_rashi'], '')} |
| Nakshatra | **{v['nakshatra']}** | {NAKSHATRA.get(v['nakshatra'], '')} |
| Current dasha | **{v['current_mahadasha']} / {v['current_antardasha']}** | {DASHA.get((v['current_mahadasha'], v['current_antardasha']), '')} |

### Planet positions (Vedic, whole-sign houses)

{table(v['planets'], [('Planet', 'planet'), ('Rashi', 'rashi'), ('Sign', 'sign'), ('Degree', 'degree'), ('House', 'house'), ('Retro', 'retrograde')])}
### Planet positions (Western)

{table(w['planets'], [('Planet', 'planet'), ('Sign', 'sign'), ('Degree', 'degree'), ('House', 'house'), ('Retro', 'retrograde')])}
## Highlights

""" + "\n".join(f"- {h}" for h in HIGHLIGHTS) + """

---
*Why do the Western and Vedic signs differ?* Western astrology uses the tropical zodiac (tied to the seasons);
Vedic astrology uses the sidereal zodiac (tied to the stars). They are currently about 24° apart, which often
shifts placements back by one sign.

*For fun and self-reflection, not a prediction of the future.*
"""
    OUT.write_text(md)


if __name__ == "__main__":
    build()
    print(f"Wrote {OUT.name}")
