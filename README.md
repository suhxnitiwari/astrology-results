# Charted

**Your birth chart, taken apart and put back together.** A Western natal chart as an interactive atlas: a chart wheel you can build
step by step, the Big Three, ten planets, houses and where their meanings came from, aspects, dignities,
sect, dispositors, fixed stars, transits, profections, progressions, a 2006–2080 timeline, and a synthesis
of what the chart repeats and where it argues with itself, a Life Lens (love, work, friendship, home,
creativity, self), a traceable chart wheel, chart DNA and an age scrubber.

Every result separates **astronomy** (where the planets were), **calculation** (how the chart is built)
and **astrology** (what the tradition says it means). Astronomy calculates the sky; astrology interprets it.

🌊 **[Visit the website](https://suhxnitiwari.github.io/astrology-results/)** · 📄 [Plain-text chart](RESULTS.md)

## How it works

| File | What it does |
|---|---|
| `chart.py` | Reads private birth details and computes the chart with the Swiss Ephemeris (tropical zodiac, Porphyry houses) → `results/chart.json` |
| `techniques.py` | Dignities, sect, dispositors, decans, minor aspects, pattern checks, fixed stars, Lilith, draconic, sidereal comparison, transits, returns, profections, progressions, solar arcs and firdaria → `results/techniques.json` |
| `data/content.json` | The written interpretations, house history, astrology history and technique atlas |
| `match.py` | Bonus experiment: which sign my personality strengths would pick → `results/personality_match.json` |
| `report.py` | Turns `results/chart.json` into `RESULTS.md` |
| `index.html` | The website: four worlds (My chart · Compatibility · Timing · Learn) |
| `report.html`, `assets/report.js` | The full downloadable report (designed pages, Save as PDF) |
| `assets/compat.js` | Sign compatibility and full-chart comparison. The other person's chart is computed in the browser with [astronomy-engine](https://github.com/cosinekitty/astronomy); nothing is uploaded or stored |
| `assets/ask.js` | Ask My Chart: questions generated from what's notable in the chart, each with evidence |
| `assets/evidence.js` | Wheel hover, colour-by modes and the "Show on the chart" evidence viewer |
| `assets/learn.js` | Grammar builder, aspect-angle toy and house wheel |
| `assets/core.js` | Shared helpers and the static chart-wheel renderer |
| `check_privacy.py` | Blocks a commit if the birth time or blocked content shows up in any tracked file |

## Privacy

Birth details live in a gitignored local file and are never committed. The rising sign and Moon are
published without degrees; the Midheaven, house cusps, Lots, Vertex, lunar returns and progressed angles are
omitted; Moon aspects carry no orb and Moon transits aren't dated, so the birth time can't be reverse-engineered.

## Run it yourself

```bash
pip install -r requirements.txt
cp birth_data.example.json birth_data.local.json   # fill in your details
python chart.py && python techniques.py && python match.py && python report.py
python -m http.server   # then open http://localhost:8000
```

*For the cosmically curious: astrology is used here as a language for reflection and play, not as a scientific personality assessment.*
