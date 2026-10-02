# VCT Viewership Predictor

A small drag-and-drop web app that predicts the average and peak concurrent
viewership for a hypothetical VALORANT Champions Tour (VCT) matchup.

Drag two teams into the matchup slots, pick an event, and it estimates
projected **average** and **peak** concurrent viewers.

## Demo

Open `index.html` in any browser, or serve the folder statically (see below).

## How it works

The prediction is a simple weighted model, not a live database pull:

- **Team weight** (`p` in `js/data.js`) — a brand-strength multiplier per
  team (1.0 = average tier-1 team), judgment-calibrated from publicly
  reported Esports Charts figures (team, event and match average/peak
  concurrent viewers).
- **Event baseline** (`avg`, `peakR` in `js/data.js`) — a typical
  single-match average viewer count and peak/average ratio for that event
  tier (VCT Champions, Masters, regional league, Kickoff, Game Changers),
  also calibrated from published Esports Charts aggregates.
- **Matchup bonus** — cross-region clashes get a bump at international
  events; same-region derbies get a smaller bump in regional leagues.
- **Marquee toggle** — flags a grand final / decider match, which boosts
  both the average and the peak.

```
predicted_avg  = event.avg * ((teamA.p + teamB.p) / 2) * matchupBonus * (marquee ? 1.5 : 1.0)
predicted_peak = predicted_avg * event.peakR * (marquee ? 1.15 : 1.0)
```

All of this lives in [`js/data.js`](js/data.js) — edit the `teams` and
`events` arrays to tune the model or add/remove teams and events.

## Project structure

```
.
├── index.html        # markup
├── css/
│   └── style.css      # styling
├── js/
│   ├── data.js         # team & event dataset (edit this to tune the model)
│   └── app.js            # drag-and-drop UI + prediction logic
└── README.md
```

## Running locally

No build step — it's plain HTML/CSS/JS. Either:

```bash
# open directly
open index.html          # macOS
start index.html          # Windows

# or serve it (recommended, avoids any local-file quirks)
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying with GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Set **Source** to the `main` branch, root folder.
4. Your app will be live at `https://<username>.github.io/<repo-name>/`.

## Data disclaimer

Team and event numbers are estimates calibrated from publicly reported
Esports Charts statistics, not a live pull from their database. Treat
predictions as directional, not exact.

## License

MIT — see [LICENSE](LICENSE).
