# Astrology Results

My birth chart, computed with the [Swiss Ephemeris](https://www.astro.com/swisseph/) in both the
Western (tropical) and Vedic (sidereal, Lahiri) systems.

👉 **[See my results](RESULTS.md)**

## How it works

| File | What it does |
|---|---|
| `chart.py` | Reads private birth details and computes planet signs, houses, nakshatra and dasha → `results/chart.json` |
| `report.py` | Turns `results/chart.json` into `RESULTS.md` |
| `check_privacy.py` | Blocks a commit if the birth time shows up in any tracked file |

## Privacy

Birth details live in `birth_data.local.json`, which is gitignored and never committed.
Published results are deliberately coarse: the Ascendant is shown by sign only, the Moon has no degree,
and no dasha dates or house cusps are included, so the birth time can't be reverse-engineered.

## Run it yourself

```bash
pip install -r requirements.txt
cp birth_data.example.json birth_data.local.json   # fill in your details
python chart.py && python report.py
```
