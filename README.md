# VCT Viewership Predictor

I made this because I kept wondering, before every big VALORANT Champions
Tour matchup, roughly how many people were actually going to tune in — and
there wasn't a quick way to eyeball that. So I built a small tool for it:
drag two teams into a matchup, pick the event, and it gives you a projected
average and peak concurrent viewer count.

It's not pulling live numbers from anywhere. It's a weighted estimate I
calibrated by hand using publicly reported Esports Charts figures — team
popularity, event-by-event viewership, and marquee-match spikes — so think
of it as a reasonable ballpark, not a forecast you'd bet money on.

All 48 current VCT teams are in there (12 per region: Americas, EMEA,
Pacific, China), each with a little generated logo badge. They're not the
real team logos — those are trademarked and I didn't want to ship copies of
them — so instead each team gets a colored monogram, with the color picked
from a hue range specific to its region. It's a small thing, but it makes
the roster easier to scan at a glance.

## Try it

Open `index.html` in a browser, or serve the folder (see "Running locally"
below). No build step, no dependencies to install.

## How the prediction actually works

Three ingredients go into every prediction:

1. **Team weight** — how much of a draw each team is, as a multiplier where
   1.0 is an average tier-1 team. I set these by hand based on how each team
   has actually performed in reported viewership (brand power, recent
   results, fanbase size). Lives in `js/data.js` as `p` on each team.
2. **Event baseline** — how big a typical match is for a given event tier
   (Champions, Masters, a regional league stage, Kickoff, Game Changers),
   plus a peak-to-average ratio for that tier. Also in `js/data.js`.
3. **Matchup context** — cross-region matchups get a viewership bump at
   international events (people love seeing region vs. region), same-region
   derbies get a smaller bump in regional leagues, and flagging a match as a
   grand final / decider boosts both numbers further.

Put together, it's just:

```
predicted_avg  = event.avg * ((teamA.weight + teamB.weight) / 2) * matchupBonus * (marquee ? 1.5 : 1.0)
predicted_peak = predicted_avg * event.peakRatio * (marquee ? 1.15 : 1.0)
```

If you want to retune it — maybe you think a team's weight is off, or a new
event tier needs adding — everything's in the `teams` and `events` arrays at
the top of `js/data.js`. No other file needs to change.

The logo badges are generated in `js/app.js`: `teamColor()` hashes a team's
name into a color within its region's hue range, and `initials()` picks a
1–2 letter monogram from the name. That also means adding a brand-new team
is just one line in `data.js` — the badge appears automatically.

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

If you want your own copy live at a URL:

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Set **Source** to the `main` branch, root folder.
4. It'll be live at `https://<username>.github.io/<repo-name>/`.

## A note on the numbers

I want to be upfront about this: the team weights and event baselines are
my own estimates, calibrated from publicly reported Esports Charts
statistics, not a live feed from their database. Use the predictions as a
rough sense of scale, not a precise forecast.

## License

MIT — see [LICENSE](LICENSE).
