"""Advanced chart mechanics and timing techniques for my natal chart.

Reads birth_data.local.json (gitignored) and writes results/techniques.json.
Everything published here is chosen so the birth time cannot be reverse-engineered:
  - no Ascendant/MC degrees, house cusps, Lots, Vertex, lunar returns, progressed angles or
    zodiacal releasing (all of these depend on the exact minute of birth);
  - nothing that pins down the Moon's degree (no Moon orbs, no transit dates to the Moon,
    no progressed-Moon ingress dates);
  - the solar return is given as a date only.
"""
import json
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path

import swisseph as swe

from chart import SIGNS, PLANETS, RULERS, ASPECTS, HOUSE_SYSTEM, load_birth, sign_of

ROOT = Path(__file__).parent
OUT = ROOT / "results" / "techniques.json"
TRAD = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"]
ELEMENTS = ["Fire", "Earth", "Air", "Water"]

# ---------- traditional dignity tables ----------
DOMICILE = {"Sun": ["Leo"], "Moon": ["Cancer"], "Mercury": ["Gemini", "Virgo"], "Venus": ["Taurus", "Libra"],
            "Mars": ["Aries", "Scorpio"], "Jupiter": ["Sagittarius", "Pisces"], "Saturn": ["Capricorn", "Aquarius"]}
EXALT = {"Sun": "Aries", "Moon": "Taurus", "Mercury": "Virgo", "Venus": "Pisces", "Mars": "Capricorn",
         "Jupiter": "Cancer", "Saturn": "Libra"}
opp = lambda s: SIGNS[(SIGNS.index(s) + 6) % 12]
# Dorothean triplicity rulers: (day, night, participating)
TRIPLICITY = {"Fire": ("Sun", "Jupiter", "Saturn"), "Earth": ("Venus", "Moon", "Mars"),
              "Air": ("Saturn", "Mercury", "Jupiter"), "Water": ("Venus", "Mars", "Moon")}
# Egyptian bounds: (ruler, end degree)
BOUNDS = {
    "Aries": [("Jupiter", 6), ("Venus", 12), ("Mercury", 20), ("Mars", 25), ("Saturn", 30)],
    "Taurus": [("Venus", 8), ("Mercury", 14), ("Jupiter", 22), ("Saturn", 27), ("Mars", 30)],
    "Gemini": [("Mercury", 6), ("Jupiter", 12), ("Venus", 17), ("Mars", 24), ("Saturn", 30)],
    "Cancer": [("Mars", 7), ("Venus", 13), ("Mercury", 19), ("Jupiter", 26), ("Saturn", 30)],
    "Leo": [("Jupiter", 6), ("Venus", 11), ("Saturn", 18), ("Mercury", 24), ("Mars", 30)],
    "Virgo": [("Mercury", 7), ("Venus", 17), ("Jupiter", 21), ("Mars", 28), ("Saturn", 30)],
    "Libra": [("Saturn", 6), ("Mercury", 14), ("Jupiter", 21), ("Venus", 28), ("Mars", 30)],
    "Scorpio": [("Mars", 7), ("Venus", 11), ("Mercury", 19), ("Jupiter", 24), ("Saturn", 30)],
    "Sagittarius": [("Jupiter", 12), ("Venus", 17), ("Mercury", 21), ("Saturn", 26), ("Mars", 30)],
    "Capricorn": [("Mercury", 7), ("Jupiter", 14), ("Venus", 22), ("Saturn", 26), ("Mars", 30)],
    "Aquarius": [("Mercury", 7), ("Venus", 13), ("Jupiter", 20), ("Mars", 25), ("Saturn", 30)],
    "Pisces": [("Venus", 12), ("Jupiter", 16), ("Mercury", 19), ("Mars", 28), ("Saturn", 30)],
}
CHALDEAN = ["Mars", "Sun", "Venus", "Mercury", "Moon", "Saturn", "Jupiter"]  # face rulers from 0° Aries
MODERN_RULER = {s: r[-1] for s, r in RULERS.items()}
TRAD_RULER = {s: r[0] for s, r in RULERS.items()}

MINOR = {"semi-sextile": (30, 2), "semi-square": (45, 2), "quintile": (72, 2),
         "sesquiquadrate": (135, 2), "biquintile": (144, 2), "quincunx": (150, 3)}

# Bright or traditionally used fixed stars, J2000 RA (h, m, s) and Dec (degrees)
STARS = {
    "Alcyone": ((3, 47, 29.1), 24.105), "Algol": ((3, 8, 10.1), 40.9556), "Aldebaran": ((4, 35, 55.2), 16.5092),
    "Rigel": ((5, 14, 32.3), -8.2017), "Capella": ((5, 16, 41.4), 45.998), "Betelgeuse": ((5, 55, 10.3), 7.4069),
    "Sirius": ((6, 45, 8.9), -16.7161), "Pollux": ((7, 45, 18.9), 28.0261), "Regulus": ((10, 8, 22.3), 11.9672),
    "Denebola": ((11, 49, 3.6), 14.5719), "Vindemiatrix": ((13, 2, 10.6), 10.9592), "Spica": ((13, 25, 11.6), -11.1614),
    "Arcturus": ((14, 15, 39.7), 19.1825), "Zubenelgenubi": ((14, 50, 52.7), -16.0417), "Zubeneschamali": ((15, 17, 0.4), -9.3831),
    "Alphecca": ((15, 34, 41.3), 26.7147), "Antares": ((16, 29, 24.5), -26.4319), "Rasalhague": ((17, 34, 56.1), 12.56),
    "Vega": ((18, 36, 56.3), 38.7836), "Nunki": ((18, 55, 15.9), -26.2967), "Altair": ((19, 50, 47.0), 8.8683),
    "Deneb Algedi": ((21, 47, 2.4), -16.1272), "Sadalmelik": ((22, 5, 47.0), -0.3197), "Fomalhaut": ((22, 57, 39.0), -29.6222),
    "Scheat": ((23, 3, 46.5), 28.0828), "Markab": ((23, 4, 45.7), 15.2053), "Achernar": ((1, 37, 42.8), -57.2367),
    "Hamal": ((2, 7, 10.4), 23.4625),
}


def star_longitude(ra, dec, jd):
    """Tropical ecliptic longitude of a star, precessed from J2000 to the chart date."""
    a = math.radians((ra[0] + ra[1] / 60 + ra[2] / 3600) * 15)
    d, e = math.radians(dec), math.radians(23.4392911)
    lon = math.degrees(math.atan2(math.sin(a) * math.cos(e) + math.tan(d) * math.sin(e), math.cos(a))) % 360
    return (lon + (jd - 2451545.0) / 365.25 * 50.29 / 3600) % 360


def sep(a, b):
    x = abs(a - b) % 360
    return min(x, 360 - x)


def fmt_date(jd_ut, offset):
    y, m, d, h = swe.revjul(jd_ut + offset / 24)
    return datetime(y, m, d).strftime("%Y-%m-%d")


def build():
    data, utc = load_birth()
    off = data["utc_offset_hours"]
    jd = swe.julday(utc.year, utc.month, utc.day, utc.hour + utc.minute / 60)
    cusps, ascmc = swe.houses(jd, data["latitude"], data["longitude"], HOUSE_SYSTEM)
    eps = swe.calc_ut(jd, swe.ECL_NUT)[0][0]
    house_of = lambda lon: int(swe.house_pos(ascmc[2], data["latitude"], eps, (lon, 0), HOUSE_SYSTEM))
    asc_sign = sign_of(ascmc[0])

    pos, spd = {}, {}
    for n, b in PLANETS.items():
        x, _ = swe.calc_ut(jd, b, swe.FLG_SWIEPH | swe.FLG_SPEED)
        pos[n], spd[n] = x[0], x[3]
    sign = {n: SIGNS[sign_of(l)] for n, l in pos.items()}
    deg = {n: l % 30 for n, l in pos.items()}
    house = {n: house_of(l) for n, l in pos.items()}

    # ---------- sect ----------
    day_chart = house["Sun"] >= 7
    sect = {
        "chart": "day" if day_chart else "night",
        "light": "Sun" if day_chart else "Moon",
        "benefic": "Jupiter" if day_chart else "Venus", "malefic": "Saturn" if day_chart else "Mars",
        "contrary_benefic": "Venus" if day_chart else "Jupiter", "contrary_malefic": "Mars" if day_chart else "Saturn",
    }

    # ---------- essential dignities ----------
    dignities = []
    for n in TRAD:
        s, d = sign[n], deg[n]
        el = ELEMENTS[SIGNS.index(s) % 4]
        trip = TRIPLICITY[el]
        bound = next(r for r, end in BOUNDS[s] if d < end)
        face = CHALDEAN[(SIGNS.index(s) * 3 + int(d // 10)) % 7]
        row = {
            "planet": n, "sign": s,
            "domicile": s in DOMICILE[n], "exaltation": EXALT[n] == s,
            "triplicity": n == (trip[0] if day_chart else trip[1]) or n == trip[2],
            "bound": bound == n, "face": face == n,
            "detriment": any(opp(x) == s for x in DOMICILE[n]), "fall": opp(EXALT[n]) == s,
            "sign_ruler": TRAD_RULER[s], "exalt_ruler": next((p for p, x in EXALT.items() if x == s), None),
            "triplicity_rulers": list(trip), "bound_ruler": bound, "face_ruler": face,
        }
        row["peregrine"] = not any(row[k] for k in ("domicile", "exaltation", "triplicity", "bound", "face"))
        score = 5 * row["domicile"] + 4 * row["exaltation"] + 3 * row["triplicity"] + 2 * row["bound"] + row["face"] \
            - 5 * row["detriment"] - 4 * row["fall"]
        row["score"] = score
        dignities.append(row)

    # ---------- receptions & dispositors ----------
    def receptions(ruler_map, names):
        found = []
        for i, a in enumerate(names):
            for b in names[i + 1:]:
                if ruler_map.get(sign[a]) == b and ruler_map.get(sign[b]) == a:
                    found.append([a, b])
        return found

    def chains(ruler_map, names):
        out = {}
        for n in names:
            path, cur = [n], n
            while True:
                nxt = ruler_map[sign[cur]]
                if nxt == cur or nxt in path:
                    path.append(nxt)
                    break
                path.append(nxt)
                cur = nxt
            out[n] = path
        finals = [n for n in names if ruler_map[sign[n]] == n]
        return out, finals

    trad_chain, trad_final = chains(TRAD_RULER, TRAD)
    mod_chain, mod_final = chains(MODERN_RULER, list(PLANETS))
    dispositors = {
        "traditional": {"chains": trad_chain, "final": trad_final, "receptions": receptions(TRAD_RULER, TRAD)},
        "modern": {"chains": mod_chain, "final": mod_final, "receptions": receptions(MODERN_RULER, list(PLANETS))},
    }

    # ---------- decans ----------
    decans = []
    for n in PLANETS:
        si = SIGNS.index(sign[n])
        k = int(deg[n] // 10)
        same_el = [SIGNS[(si + 4 * j) % 12] for j in range(3)]
        decans.append({"planet": n, "sign": sign[n], "decan": k + 1,
                       "face_ruler": CHALDEAN[(si * 3 + k) % 7],
                       "triplicity_sign": same_el[k], "modern_ruler": MODERN_RULER[same_el[k]]})

    # ---------- degrees of note ----------
    degree_notes = []
    for n in PLANETS:
        if n == "Moon":
            continue
        d = int(deg[n])
        if d == 0:
            degree_notes.append({"planet": n, "degree": d, "note": "early degree: the planet has just entered its sign"})
        if d == 29:
            degree_notes.append({"planet": n, "degree": d, "note": "anaretic (final) degree"})
        if sign[n] in ("Aries", "Cancer", "Libra", "Capricorn") and d in (0, 13, 26) or \
           sign[n] in ("Taurus", "Leo", "Scorpio", "Aquarius") and d in (8, 9, 21, 22) or \
           sign[n] in ("Gemini", "Virgo", "Sagittarius", "Pisces") and d in (4, 17):
            degree_notes.append({"planet": n, "degree": d, "note": "a traditional 'critical degree' for its modality"})

    # ---------- aspects: major + minor, applying / separating ----------
    later = {}
    for n, b in PLANETS.items():
        later[n] = swe.calc_ut(jd + 0.01, b)[0][0]
    names = list(PLANETS)
    all_aspects = []
    for kind_set, table in (("major", ASPECTS), ("minor", MINOR)):
        for i, a in enumerate(names):
            for b in names[i + 1:]:
                s_now = sep(pos[a], pos[b])
                for kind, (angle, orb) in table.items():
                    allowed = orb + (2 if kind_set == "major" and {"Sun", "Moon"} & {a, b} else 0)
                    if abs(s_now - angle) <= allowed:
                        applying = abs(sep(later[a], later[b]) - angle) < abs(s_now - angle)
                        row = {"a": a, "b": b, "type": kind, "class": kind_set, "applying": applying}
                        if "Moon" not in (a, b):
                            row["orb"] = round(abs(s_now - angle), 1)
                        all_aspects.append(row)

    def has(a, b, kind):
        return any({x["a"], x["b"]} == {a, b} and x["type"] == kind for x in all_aspects)

    patterns = []
    for i, a in enumerate(names):
        for j, b in enumerate(names):
            if j <= i:
                continue
            for c in names:
                if c in (a, b):
                    continue
                if has(a, b, "opposition") and has(a, c, "square") and has(b, c, "square"):
                    patterns.append({"type": "T-square", "planets": sorted([a, b]) + [c]})
                if has(a, b, "sextile") and has(a, c, "quincunx") and has(b, c, "quincunx"):
                    patterns.append({"type": "Yod", "planets": sorted([a, b]) + [c]})
                if c > b and has(a, b, "trine") and has(b, c, "trine") and has(a, c, "trine"):
                    patterns.append({"type": "Grand trine", "planets": [a, b, c]})
    checked = ["T-square", "Grand trine", "Yod", "Grand cross", "Kite", "Mystic rectangle"]

    # ---------- chart shape ----------
    lons = sorted(pos.values())
    gaps = sorted((((lons[(i + 1) % 10] - lons[i]) % 360), i) for i in range(10))
    max_gap = gaps[-1][0]
    big_gaps = [g for g, _ in gaps if g >= 60]
    if 360 - max_gap <= 120:
        shape = "Bundle"
    elif max_gap >= 180:
        shape = "Bowl"
    elif max_gap >= 120:
        shape = "Locomotive"
    elif len(big_gaps) >= 2:
        shape = "Seesaw"
    else:
        shape = "Splay"
    shape_info = {"shape": shape, "largest_gap": round(max_gap), "gaps_over_60": [round(g) for g in big_gaps]}

    # ---------- fixed stars (conjunctions within 1°, Moon excluded) ----------
    stars = []
    for star, (ra, dec) in STARS.items():
        sl = star_longitude(ra, dec, jd)
        for n in PLANETS:
            if n != "Moon" and sep(sl, pos[n]) <= 1.0:
                stars.append({"star": star, "planet": n, "star_sign": SIGNS[sign_of(sl)], "star_degree": int(sl % 30),
                              "orb": round(sep(sl, pos[n]), 1)})

    # ---------- other points ----------
    true_node = swe.calc_ut(jd, swe.TRUE_NODE)[0][0]
    mean_node = swe.calc_ut(jd, swe.MEAN_NODE)[0][0]
    mean_lilith = swe.calc_ut(jd, swe.MEAN_APOG)[0][0]
    true_lilith = swe.calc_ut(jd, swe.OSCU_APOG)[0][0]
    point = lambda l: {"sign": SIGNS[sign_of(l)], "degree": int(l % 30), "house": house_of(l)}
    points = {"true_node": point(true_node), "mean_node": point(mean_node),
              "mean_lilith": point(mean_lilith), "true_lilith": point(true_lilith)}

    # ---------- draconic ----------
    draconic = [{"planet": n, "sign": SIGNS[sign_of((l - true_node) % 360)],
                 **({"degree": int(((l - true_node) % 360) % 30)} if n != "Moon" else {})} for n, l in pos.items()]

    # ---------- sidereal comparison ----------
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    ayan = swe.get_ayanamsa_ut(jd)
    sidereal = {"ayanamsa": "Lahiri", "offset": round(ayan, 1),
                "sun": SIGNS[sign_of((pos["Sun"] - ayan) % 360)], "moon": SIGNS[sign_of((pos["Moon"] - ayan) % 360)],
                "rising": SIGNS[sign_of((ascmc[0] - ayan) % 360)]}

    # ---------- house systems (planet placements only) ----------
    whole = {n: (sign_of(l) - asc_sign) % 12 + 1 for n, l in pos.items()}
    house_systems = {"Porphyry": house, "Whole sign": whole,
                     "differences": [n for n in PLANETS if house[n] != whole[n]]}

    # ================= TIMING =================
    now = datetime.now(timezone.utc)
    jd_now = swe.julday(now.year, now.month, now.day, 12)
    birth_date = datetime.fromisoformat(data["date"]).date()
    today = now.date()
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))

    # annual profections (whole-sign, traditional lord)
    prof = []
    for a in range(0, 37):
        s = SIGNS[(asc_sign + a) % 12]
        prof.append({"age": a, "house": a % 12 + 1, "sign": s, "lord": TRAD_RULER[s], "modern_lord": MODERN_RULER[s]})

    # transits right now (slow planets to natal planets, Moon excluded)
    slow = ["Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]
    tpos = {n: swe.calc_ut(jd_now, PLANETS[n])[0][0] for n in PLANETS}
    sky_now = {n: {"sign": SIGNS[sign_of(l)], "degree": int(l % 30)} for n, l in tpos.items() if n != "Moon"}
    transits_now = []
    for t in slow:
        for n in PLANETS:
            if n == "Moon":
                continue
            for kind, (angle, _) in ASPECTS.items():
                o = abs(sep(tpos[t], pos[n]) - angle)
                if o <= 2:
                    transits_now.append({"transit": t, "type": kind, "natal": n, "orb": round(o, 1)})

    # exact slow-planet transits over the next 12 months (Moon excluded)
    upcoming = []
    last = {}
    for day in range(0, 366):
        j = jd_now + day
        for t in slow:
            tl = swe.calc_ut(j, PLANETS[t])[0][0]
            for n in PLANETS:
                if n == "Moon":
                    continue
                for kind, (angle, _) in ASPECTS.items():
                    o = abs(sep(tl, pos[n]) - angle)
                    key = (t, n, kind)
                    prev = last.get(key)
                    if prev and prev[1] < prev[0] and prev[1] <= o and prev[1] < 0.15:
                        upcoming.append({"transit": t, "type": kind, "natal": n, "date": fmt_date(j - 1, off)})
                    last[key] = (prev[1] if prev else 99, o)

    # returns
    def crossings(body, target, start, years):
        out, j = [], start
        prev = (swe.calc_ut(j, body)[0][0] - target + 540) % 360 - 180
        for step in range(int(years * 365)):
            j += 1
            cur = (swe.calc_ut(j, body)[0][0] - target + 540) % 360 - 180
            if (prev < 0 <= cur or prev > 0 >= cur) and abs(cur - prev) < 10:
                out.append(fmt_date(j, off))
            prev = cur
        return out

    returns = {
        "jupiter": crossings(swe.JUPITER, pos["Jupiter"], jd + 300, 75),
        "saturn": crossings(swe.SATURN, pos["Saturn"], jd + 300, 75),
        "nodal": crossings(swe.MEAN_NODE, mean_node, jd + 300, 75),
        "nodal_opposition": crossings(swe.MEAN_NODE, (mean_node + 180) % 360, jd, 75),
        "uranus_opposition": crossings(swe.URANUS, (pos["Uranus"] + 180) % 360, jd, 75),
    }

    # the sky right now: retrogrades and the Moon's phase
    retro_now = [n for n in PLANETS if n not in ("Sun", "Moon") and swe.calc_ut(jd_now, PLANETS[n], swe.FLG_SPEED)[0][3] < 0]
    elong = (tpos["Moon"] - tpos["Sun"]) % 360
    phases = ["New Moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full Moon", "Waning gibbous", "Last quarter", "Waning crescent"]
    moon_now = {"sign": SIGNS[sign_of(tpos["Moon"])], "phase": phases[int(((elong + 22.5) % 360) // 45)],
                "illumination": round((1 - math.cos(math.radians(elong))) / 2 * 100)}

    # how birth-time uncertainty affects each sign (planets move slowly; houses and angles do not)
    day_start = swe.julday(birth_date.year, birth_date.month, birth_date.day, 0) - off / 24
    sign_confidence = {n: SIGNS[sign_of(swe.calc_ut(day_start, b)[0][0])] == sign[n] == SIGNS[sign_of(swe.calc_ut(day_start + 1, b)[0][0])]
                       for n, b in PLANETS.items()}

    # secondary progressions (a day for a year): Sun and slow personal planets, no angles, Moon sign only
    years = (today - birth_date).days / 365.2422
    jd_prog = jd + years
    prog = {}
    for n in ["Sun", "Moon", "Mercury", "Venus", "Mars"]:
        l = swe.calc_ut(jd_prog, PLANETS[n])[0][0]
        prog[n] = {"sign": SIGNS[sign_of(l)], **({"degree": int(l % 30)} if n != "Moon" else {})}
    # when the progressed Sun changed sign, and when progressed Mercury stationed direct
    prog_events = []
    prev_sign, prev_speed = sign_of(pos["Sun"]), spd["Mercury"]
    for dday in range(1, 90):
        s = sign_of(swe.calc_ut(jd + dday, swe.SUN)[0][0])
        if s != prev_sign:
            prog_events.append({"event": f"Progressed Sun enters {SIGNS[s]}", "age": dday - 1, "year": birth_date.year + dday - 1})
            prev_sign = s
        v = swe.calc_ut(jd + dday, swe.MERCURY, swe.FLG_SPEED)[0][3]
        if prev_speed < 0 <= v:
            prog_events.append({"event": "Progressed Mercury turns direct", "age": dday - 1, "year": birth_date.year + dday - 1})
        prev_speed = v

    # solar arc directions (arc = progressed Sun - natal Sun), contacts within 1°, Moon excluded
    arc = (swe.calc_ut(jd_prog, swe.SUN)[0][0] - pos["Sun"]) % 360
    solar_arc = []
    for a in PLANETS:
        if a == "Moon":
            continue
        dl = (pos[a] + arc) % 360
        for b in PLANETS:
            if b == "Moon":
                continue
            for kind, (angle, _) in ASPECTS.items():
                o = abs(sep(dl, pos[b]) - angle)
                if o <= 1:
                    solar_arc.append({"directed": a, "type": kind, "natal": b, "orb": round(o, 1)})

    # firdaria (day-chart sequence), major period and sub-period for today
    fird_seq = [("Sun", 10), ("Venus", 8), ("Mercury", 13), ("Moon", 9), ("Saturn", 11), ("Jupiter", 12), ("Mars", 7),
                ("North Node", 3), ("South Node", 2)] if day_chart else \
               [("Moon", 9), ("Saturn", 11), ("Jupiter", 12), ("Mars", 7), ("Sun", 10), ("Venus", 8), ("Mercury", 13),
                ("North Node", 3), ("South Node", 2)]
    t0, firdaria = 0.0, []
    for lord, length in fird_seq:
        firdaria.append({"lord": lord, "from_age": t0, "to_age": t0 + length})
        t0 += length
    cur = next(f for f in firdaria if f["from_age"] <= years < f["to_age"])
    order7 = [x for x, _ in fird_seq[:7]]
    sub_len = (cur["to_age"] - cur["from_age"]) / 7
    k = int((years - cur["from_age"]) // sub_len)
    start = order7.index(cur["lord"]) if cur["lord"] in order7 else 0
    fird_now = {"major": cur["lord"], "major_from": cur["from_age"], "major_to": cur["to_age"],
                "sub": order7[(start + k) % 7] if cur["lord"] in order7 else None}

    # monthly slow-planet positions 2006-2080, for looking up any date in the browser
    monthly = {}
    for y in range(2006, 2081):
        for m in range(1, 13):
            jm = swe.julday(y, m, 15, 12)
            monthly[f"{y}-{m:02d}"] = [round(swe.calc_ut(jm, PLANETS[n])[0][0], 1) for n in slow]

    # next solar return, as a date only
    sr = swe.solcross_ut(pos["Sun"], jd_now, swe.FLG_SWIEPH)
    solar_return = fmt_date(sr, off)

    result = {
        "as_of": today.isoformat(), "age": age,
        "sect": sect, "dignities": dignities, "dispositors": dispositors, "decans": decans,
        "degree_notes": degree_notes, "aspects": all_aspects, "patterns": {"found": patterns, "checked": checked},
        "shape": shape_info, "fixed_stars": stars, "points": points, "draconic": draconic, "sidereal": sidereal,
        "house_systems": house_systems,
        "timing": {
            "profections": prof, "sky_now": sky_now, "transits_now": transits_now, "upcoming": upcoming,
            "returns": returns, "progressions": prog, "progression_events": prog_events,
            "solar_arc": {"arc": round(arc, 1), "contacts": solar_arc}, "firdaria": firdaria, "firdaria_now": fird_now,
            "solar_return": solar_return, "monthly_slow": {"planets": slow, "positions": monthly}, "retrograde_now": retro_now, "moon_now": moon_now,
        },
        "sign_same_all_day": sign_confidence,
    }
    OUT.write_text(json.dumps(result, indent=2) + "\n")
    return result


if __name__ == "__main__":
    r = build()
    print("sect", r["sect"]["chart"], "| shape", r["shape"], "| patterns", r["patterns"]["found"])
    for d in r["dignities"]:
        print(d["planet"], d["sign"], {k: d[k] for k in ("domicile", "exaltation", "triplicity", "bound", "face", "detriment", "fall", "peregrine", "score")})
    print("disp trad", r["dispositors"]["traditional"])
    print("disp mod receptions", r["dispositors"]["modern"]["receptions"], "final", r["dispositors"]["modern"]["final"])
    print("decans", [(d["planet"], d["decan"], d["face_ruler"]) for d in r["decans"]])
    print("degree notes", r["degree_notes"])
    print("minor", [a for a in r["aspects"] if a["class"] == "minor"])
    print("major applying", [(a["a"], a["type"], a["b"], a["applying"]) for a in r["aspects"] if a["class"] == "major"])
    print("stars", r["fixed_stars"])
    print("points", r["points"])
    print("draconic", r["draconic"])
    print("sidereal", r["sidereal"])
    print("houses diff", r["house_systems"]["differences"])
    t = r["timing"]
    print("age", r["age"], "profection", t["profections"][r["age"]])
    print("now", t["transits_now"])
    print("upcoming", t["upcoming"])
    print("returns", t["returns"])
    print("prog", t["progressions"], t["progression_events"])
    print("solar arc", t["solar_arc"])
    print("firdaria now", t["firdaria_now"], "SR", t["solar_return"])
