# Charted

*Your birth chart, taken apart and put back together.*

**Live:** https://suhxnitiwari.github.io/astrology-results/ · [Plain-text chart](RESULTS.md)

## What it is

Charted is a Western natal chart presented as an interactive atlas. Most horoscope sites hand you a verdict. This one shows its work: every result separates **astronomy** (where the planets were), **calculation** (how the chart is built) and **astrology** (what the tradition says it means).

The site is organized into four worlds:

- **My chart:** a chart wheel you can build one layer at a time, the Big Three, ten planets, houses and where their meanings came from, aspects, and a synthesis of what the chart repeats and where it argues with itself. A Life Lens reads it through love, work, friendship, home, creativity and self.
- **Compatibility:** sign compatibility, plus a full chart-to-chart comparison with anyone whose birth details you enter.
- **Timing:** transits, returns, profections, progressions, solar arcs and a 2006–2080 timeline with an age scrubber.
- **Learn:** a grammar builder ("planet in sign in house"), an aspect-angle toy and a house wheel.

**Ask My Chart** is a deterministic question set: a question only appears if the chart actually has the feature it asks about, and each answer cites its evidence and lights it up on the wheel. There's also a designed, multi-page report you can save as a PDF.

## How it's built

**Real astronomy, computed in Python.** `chart.py` computes the chart with the Swiss Ephemeris (`pyswisseph`): tropical zodiac, Porphyry houses, major aspects with wider orbs for the Sun and Moon, elements, modalities, hemispheres, rulers and nodes. `techniques.py` (about 490 lines) layers on the traditional techniques: dignities, sect, dispositors, decans, minor aspects, pattern detection, fixed stars, Lilith, the draconic chart, a sidereal comparison, transits, returns, profections, progressions, solar arcs and firdaria. Both write JSON that the site reads.

**A second chart, computed in the browser.** For compatibility, the other person's chart is calculated client-side with [astronomy-engine](https://github.com/cosinekitty/astronomy). Their birth details are never uploaded or stored.

**Content kept separate from code.** All interpretations, house history, astrology history and the technique atlas live in `data/content.json`, so the writing can change without touching the renderer.

**Privacy by construction.** Birth details live in a gitignored local file and never get committed. The published data is deliberately coarse so the birth time can't be reverse-engineered: the rising sign and Moon appear without degrees; the Midheaven, house cusps, Lots, Vertex, lunar returns and progressed angles are left out; Moon aspects carry no orb; and Moon transits aren't dated. `check_privacy.py` scans every tracked file for the birth time (in several formats) and for a private list of blocked words, and fails before a commit if it finds either. Both lists stay in gitignored files, so the guard never publishes what it protects.

**A small experiment.** `match.py` asks which sign my personality strengths alone would pick: each sign's score is the average of my scores on the strengths astrology assigns it.

| File | What it does |
|---|---|
| `chart.py` | Computes the natal chart → `results/chart.json` |
| `techniques.py` | Traditional and predictive techniques → `results/techniques.json` |
| `match.py` | Personality-to-sign experiment → `results/personality_match.json` |
| `report.py` | Turns the chart into `RESULTS.md` |
| `check_privacy.py` | Pre-commit leak check |
| `index.html`, `assets/*.js` | The site: wheel rendering, evidence viewer, compatibility, Ask My Chart, Learn |
| `report.html`, `assets/report.js` | The printable report |

## Design choices

- Serif headings in Cormorant Garamond with DM Sans body text, flowing wave dividers between sections, and hand-built SVG chart wheels.
- Light and dark themes that follow your system setting, and animations that respect reduced-motion preferences.
- A traceable wheel: hover a planet or use the "Show on the chart" buttons to see exactly which placements a sentence is based on.
- Astrology is framed as a language for reflection and play, not a scientific personality assessment, and the site says so.

## Tech stack

Python (pyswisseph), vanilla JavaScript, HTML/CSS with inline SVG, astronomy-engine, GitHub Pages.

## Run it yourself

```bash
pip install -r requirements.txt
cp birth_data.example.json birth_data.local.json   # fill in your details
python chart.py && python techniques.py && python match.py && python report.py
python -m http.server   # then open http://localhost:8000
```

Built by [Suhani Tiwari](https://suhanitiwari.com).
