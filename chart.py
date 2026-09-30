"""Compute a birth chart (Western tropical + Vedic sidereal) from private birth data.

Reads birth_data.local.json (gitignored) and writes results/chart.json.
Output is deliberately coarse so the birth time cannot be reverse-engineered:
  - Ascendant is reported by sign only (no degree).
  - The Moon is reported by sign and nakshatra only (no degree or pada).
  - Other planets are rounded to whole degrees.
  - No house cusps, dasha dates, or timestamps are written.
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
RASHI = ["Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula",
         "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"]
NAKSHATRAS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
              "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
              "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha",
              "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana",
              "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada",
              "Revati"]
# Vimshottari dasha lords in nakshatra order, with period lengths in years
DASHA = [("Ketu", 7), ("Venus", 20), ("Sun", 6), ("Moon", 10), ("Mars", 7),
         ("Rahu", 18), ("Jupiter", 16), ("Saturn", 19), ("Mercury", 17)]

PLANETS = {
    "Sun": swe.SUN, "Moon": swe.MOON, "Mercury": swe.MERCURY, "Venus": swe.VENUS,
    "Mars": swe.MARS, "Jupiter": swe.JUPITER, "Saturn": swe.SATURN,
    "Uranus": swe.URANUS, "Neptune": swe.NEPTUNE, "Pluto": swe.PLUTO,
    "Rahu": swe.MEAN_NODE,
}
VEDIC = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"]


def load_birth():
    if not PRIVATE.exists():
        sys.exit("Missing birth_data.local.json - copy birth_data.example.json and fill it in.")
    data = json.loads(PRIVATE.read_text())
    local = datetime.fromisoformat(f"{data['date']}T{data['time']}")
    utc = local - timedelta(hours=data["utc_offset_hours"])
    return data, utc.replace(tzinfo=timezone.utc)


def julian_day(utc):
    return swe.julday(utc.year, utc.month, utc.day, utc.hour + utc.minute / 60)


def longitudes(jd, flags):
    out = {}
    for name, body in PLANETS.items():
        pos, _ = swe.calc_ut(jd, body, flags | swe.FLG_SPEED)
        out[name] = {"lon": pos[0], "retro": pos[3] < 0}
    out["Ketu"] = {"lon": (out["Rahu"]["lon"] + 180) % 360, "retro": True}
    return out


def sign_of(lon):
    return int(lon // 30)


def current_dasha(moon_sid, birth_utc, today):
    """Return the running Mahadasha and Antardasha lord names (no dates)."""
    span = 360 / 27
    nak = int(moon_sid // span)
    lord_idx = nak % 9
    elapsed_frac = (moon_sid % span) / span
    year = 365.2425
    start = birth_utc - timedelta(days=elapsed_frac * DASHA[lord_idx][1] * year)
    i = lord_idx
    while True:
        lord, yrs = DASHA[i % 9]
        end = start + timedelta(days=yrs * year)
        if end > today:
            break
        start, i = end, i + 1
    maha_lord, maha_yrs = DASHA[i % 9]
    sub_start = start
    for j in range(9):
        sub_lord, sub_yrs = DASHA[(i + j) % 9]
        sub_end = sub_start + timedelta(days=maha_yrs * sub_yrs / 120 * year)
        if sub_end > today:
            return maha_lord, sub_lord
        sub_start = sub_end


def build():
    data, utc = load_birth()
    jd = julian_day(utc)
    lat, lon = data["latitude"], data["longitude"]

    tropical = longitudes(jd, swe.FLG_SWIEPH)
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    sidereal = longitudes(jd, swe.FLG_SWIEPH | swe.FLG_SIDEREAL)

    _, ascmc = swe.houses(jd, lat, lon, b"W")
    asc_trop = ascmc[0]
    asc_sid = (asc_trop - swe.get_ayanamsa_ut(jd)) % 360

    def planet_row(name, lon_, retro, asc_sign, hide_degree=False):
        s = sign_of(lon_)
        row = {"planet": name, "sign": s, "house": (s - asc_sign) % 12 + 1, "retrograde": retro}
        if not hide_degree:
            row["degree"] = int(lon_ % 30)
        return row

    asc_t, asc_s = sign_of(asc_trop), sign_of(asc_sid)
    western = [planet_row(n, p["lon"], p["retro"], asc_t, hide_degree=(n == "Moon"))
               for n, p in tropical.items() if n not in ("Rahu", "Ketu")]
    for row in western:
        row["sign"] = SIGNS[row["sign"]]
    vedic = [planet_row(n, sidereal[n]["lon"], sidereal[n]["retro"] if n not in ("Rahu", "Ketu") else True,
                        asc_s, hide_degree=(n == "Moon")) for n in VEDIC]
    for row in vedic:
        row["rashi"] = RASHI[row["sign"]]
        row["sign"] = SIGNS[row["sign"]]

    moon_sid = sidereal["Moon"]["lon"]
    sun_sid = sidereal["Sun"]["lon"]
    maha, antar = current_dasha(moon_sid, utc, datetime.now(timezone.utc))

    result = {
        "place": data["place"],
        "western": {
            "sun_sign": SIGNS[sign_of(tropical["Sun"]["lon"])],
            "moon_sign": SIGNS[sign_of(tropical["Moon"]["lon"])],
            "rising_sign": SIGNS[asc_t],
            "planets": western,
        },
        "vedic": {
            "ayanamsa": "Lahiri",
            "lagna": SIGNS[asc_s], "lagna_rashi": RASHI[asc_s],
            "moon_rashi": RASHI[sign_of(moon_sid)], "moon_sign": SIGNS[sign_of(moon_sid)],
            "sun_rashi": RASHI[sign_of(sun_sid)],
            "nakshatra": NAKSHATRAS[int(moon_sid // (360 / 27))],
            "current_mahadasha": maha,
            "current_antardasha": antar,
            "planets": vedic,
        },
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(result, indent=2) + "\n")
    return result


if __name__ == "__main__":
    print(json.dumps(build(), indent=2))
