"""Compute a Western (tropical) natal chart from private birth data.

Reads birth_data.local.json (gitignored) and writes results/chart.json: placements, whole-sign
Porphyry houses, major aspects, elements, modalities, hemispheres, rulers and nodes.

Output is deliberately coarse so the birth time cannot be reverse-engineered:
  - The Ascendant is reported by sign only (no degree), and the Midheaven is not reported.
  - The Moon is reported by sign only, and aspects to the Moon carry no orb.
  - Other planets are rounded to whole degrees.
"""
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import swisseph as swe

ROOT = Path(__file__).parent
PRIVATE = ROOT / "birth_data.local.json"
OUT = ROOT / "results" / "chart.json"

SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra",
         "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
ELEMENTS = ["Fire", "Earth", "Air", "Water"]
MODALITIES = ["Cardinal", "Fixed", "Mutable"]
# Traditional and modern rulers of each sign
RULERS = {
    "Aries": ["Mars"], "Taurus": ["Venus"], "Gemini": ["Mercury"], "Cancer": ["Moon"],
    "Leo": ["Sun"], "Virgo": ["Mercury"], "Libra": ["Venus"], "Scorpio": ["Mars", "Pluto"],
    "Sagittarius": ["Jupiter"], "Capricorn": ["Saturn"], "Aquarius": ["Saturn", "Uranus"],
    "Pisces": ["Jupiter", "Neptune"],
}
PLANETS = {
    "Sun": swe.SUN, "Moon": swe.MOON, "Mercury": swe.MERCURY, "Venus": swe.VENUS,
    "Mars": swe.MARS, "Jupiter": swe.JUPITER, "Saturn": swe.SATURN,
    "Uranus": swe.URANUS, "Neptune": swe.NEPTUNE, "Pluto": swe.PLUTO,
}
# Major aspects: angle and orb. Aspects to the Sun or Moon get 2° extra orb.
HOUSE_SYSTEM = b"O"
ASPECTS = {"conjunction": (0, 8), "sextile": (60, 5), "square": (90, 7), "trine": (120, 7), "opposition": (180, 8)}


def load_birth():
    if not PRIVATE.exists():
        sys.exit("Missing birth_data.local.json - copy birth_data.example.json and fill it in.")
    data = json.loads(PRIVATE.read_text())
    local = datetime.fromisoformat(f"{data['date']}T{data['time']}")
    utc = local - timedelta(hours=data["utc_offset_hours"])
    return data, utc.replace(tzinfo=timezone.utc)


def sign_of(lon):
    return int(lon // 30)


def find_aspects(lons):
    names = list(lons)
    found = []
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            sep = abs(lons[a] - lons[b]) % 360
            sep = min(sep, 360 - sep)
            for kind, (angle, orb) in ASPECTS.items():
                allowed = orb + (2 if {"Sun", "Moon"} & {a, b} else 0)
                off = abs(sep - angle)
                if off <= allowed:
                    row = {"a": a, "b": b, "type": kind}
                    if "Moon" not in (a, b):
                        row["orb"] = round(off, 1)
                    found.append(row)
    return sorted(found, key=lambda r: r.get("orb", 9))


def build():
    data, utc = load_birth()
    jd = swe.julday(utc.year, utc.month, utc.day, utc.hour + utc.minute / 60)
    # Porphyry houses: they reproduce the house placements in my canonical chart document.
    cusps, ascmc = swe.houses(jd, data["latitude"], data["longitude"], HOUSE_SYSTEM)
    asc = sign_of(ascmc[0])
    eps = swe.calc_ut(jd, swe.ECL_NUT)[0][0]
    house_of = lambda lon: int(swe.house_pos(ascmc[2], data["latitude"], eps, (lon, 0), HOUSE_SYSTEM))

    planets, lons = [], {}
    for name, body in PLANETS.items():
        pos, _ = swe.calc_ut(jd, body, swe.FLG_SWIEPH | swe.FLG_SPEED)
        lons[name] = pos[0]
        s = sign_of(pos[0])
        row = {"planet": name, "sign": SIGNS[s], "house": house_of(pos[0]),
               "element": ELEMENTS[s % 4], "modality": MODALITIES[s % 3], "retrograde": pos[3] < 0}
        if name != "Moon":
            row["degree"] = int(pos[0] % 30)
        planets.append(row)

    node, _ = swe.calc_ut(jd, swe.TRUE_NODE)
    n_sign = sign_of(node[0])
    nodes = {
        "north": {"sign": SIGNS[n_sign], "house": house_of(node[0]), "degree": int(node[0] % 30)},
        "south": {"sign": SIGNS[(n_sign + 6) % 12], "house": house_of((node[0] + 180) % 360), "degree": int(node[0] % 30)},
    }

    count = lambda key, values: {v: [p["planet"] for p in planets if p[key] == v] for v in values}
    houses = [{"house": h,  # cusp signs omitted: with the Ascendant sign they would narrow the birth time
               "planets": [p["planet"] for p in planets if p["house"] == h]} for h in range(1, 13)]
    in_houses = lambda hs: [p["planet"] for p in planets if p["house"] in hs]

    result = {
        "place": data["place"],
        "house_system": "Porphyry",
        "sun_sign": SIGNS[sign_of(lons["Sun"])],
        "moon_sign": SIGNS[sign_of(lons["Moon"])],
        "rising_sign": SIGNS[asc],
        "rising_element": ELEMENTS[asc % 4],
        "rising_modality": MODALITIES[asc % 3],
        "planets": planets,
        "nodes": nodes,
        "houses": houses,
        "aspects": find_aspects(lons),
        "elements": count("element", ELEMENTS),
        "modalities": count("modality", MODALITIES),
        "hemispheres": {
            "above": in_houses(range(7, 13)), "below": in_houses(range(1, 7)),
            "east": in_houses([10, 11, 12, 1, 2, 3]), "west": in_houses(range(4, 10)),
        },
        "house_types": {
            "angular": in_houses([1, 4, 7, 10]), "succedent": in_houses([2, 5, 8, 11]), "cadent": in_houses([3, 6, 9, 12]),
        },
        "rulers": {
            "chart_ruler": RULERS[SIGNS[asc]],
            "sun_sign_rulers": RULERS[SIGNS[sign_of(lons["Sun"])]],
            "moon_sign_rulers": RULERS[SIGNS[sign_of(lons["Moon"])]],
        },
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(result, indent=2) + "\n")
    return result


if __name__ == "__main__":
    r = build()
    print({k: {e: len(v) for e, v in r[k].items()} for k in ("elements", "modalities", "hemispheres", "house_types")})
    for a in r["aspects"]:
        print(a)
