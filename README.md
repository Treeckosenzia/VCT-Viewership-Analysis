# Predicting VALORANT Esports Viewership by Region

**Question:** How much of a VCT match's audience is explained by *where* it is played (Pacific, EMEA, China, Americas) versus *what* is being played (stage, teams, schedule), and can we forecast the peak viewers of a future match before it airs?

**Unit of analysis:** one regional-league match. **Target:** peak concurrent viewers (modelled as `log(peak)`).

> ⚠️ **The bundled dataset is synthetic.** `src/make_synthetic_data.py` simulates 1,155 matches so the pipeline runs end to end. Its magnitudes are loosely calibrated to public 2026 figures, but every row is fake. Do Step 3 (real data) before trusting any finding.

---

## What the real world looks like (context for your hypotheses)

Public Esports Charts / press coverage of the 2026 season gives you these starting hypotheses to test with real data:

| Signal | What was reported |
|---|---|
| Pacific rising | Overtook the Americas in Kickoff watch time (~4.7M vs ~4.0M hours in week one) and posted a record 486K Kickoff peak. Japanese and Thai audiences were key growth drivers. |
| EMEA falling | Week-one Kickoff watch time roughly halved year over year; Stage 1 fell >25% on both hours watched and peak. |
| Americas mixed | Stage 1 was down, but Stage 2's grand final (100 Thieves vs LOUD) peaked at ~523K, with Kick carrying ~24% of watch time via community co-streamers. |
| Stage 1 finals | Pacific ~534K, Americas ~295K, EMEA ~223K peak viewers. |
| China | Measured *international* audience is small and hard to compare (see caveat below). |

Sources: [Esports Charts – Pacific Kickoff](https://escharts.com/news/vct-2026-pacific-kickoff-recap), [Esports Charts – Americas Stage 2](https://escharts.com/news/vct-2026-americas-stage-2-viewership), [Sheep Esports – Stage 1 finals](https://www.sheepesports.com/en/articles/vct-pacific-final-leads-stage-1-viewership-ahead-of-americas-and-emea/en), [The Spike – Stage 1 analysis](https://www.thespike.gg/valorant/news/vct-2026-stage-1-viewership-analysis-record-lows-and-shifting-peaks-compared-to-2025/8168).

**China caveat (important):** Esports Charts mostly captures Twitch/YouTube/Kick-style platforms. Chinese domestic platforms (Bilibili, Huya, Douyu, Douyin) are largely not tracked, so "China viewership" in public datasets is a *measurement artifact* of the international broadcast, not the league's true audience. Say this explicitly in your write-up, or model China separately.

---

## Project layout

```
vct-viewership/
├── README.md               <- this guide
├── requirements.txt
├── data/
│   ├── raw/matches.csv             <- one row per match (synthetic now; replace it)
│   ├── raw/upcoming_template.csv   <- fixtures to forecast
│   └── processed/                  <- engineered features + saved model
├── src/
│   ├── config.py                   <- paths and constants
│   ├── make_synthetic_data.py      <- placeholder data generator
│   ├── eda.py                      <- charts
│   ├── features.py                 <- leakage-free feature engineering
│   ├── train.py                    <- baselines, models, validation, importance
│   └── predict.py                  <- forecast upcoming matches
└── outputs/                        <- charts, metrics, forecast.csv
```

Run everything: `cd src && python make_synthetic_data.py && python eda.py && python train.py && python predict.py`

---

## Step-by-step guide

### Step 1 · Set up the environment
```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```
`lightgbm` and `shap` are optional (used in "Level up"). The core pipeline needs only pandas, numpy, scikit-learn and matplotlib.

### Step 2 · Define the data contract
Every script reads `data/raw/matches.csv`. One row per match:

| Column | Type | Notes |
|---|---|---|
| `date` | datetime (UTC) | Scheduled start time |
| `region` | Pacific / EMEA / China / Americas | |
| `year` | int | |
| `event` | Kickoff / Stage 1 / Stage 2 | Extend with Masters / Champions later |
| `phase` | Group / Playoff / Grand Final | |
| `team_a`, `team_b` | str | Use one canonical spelling per org (rebrands!) |
| `best_of` | 3 or 5 | |
| `start_hour_utc` | int 0-23 | |
| `co_streams` | int | Number of co-streaming channels (proxy for creator reach) |
| `competing_event` | 0/1 | Big overlapping esports event (LoL, CS2, etc.) |
| `peak_viewers` | int | **Target.** Peak concurrent viewers, all tracked platforms |

### Step 3 · Collect real data (replace the synthetic file)
Build the CSV above from:

1. **Esports Charts** (escharts.com): event pages list matches with peak viewers, average viewers, hours watched, and language/platform splits. Check their terms for data export or licensing before scraping; a paid/API tier may exist.
2. **Liquipedia VALORANT** (liquipedia.net/valorant): match schedules, results, rosters, format (Bo3/Bo5), and team names. It has a documented API with strict rate limits and attribution requirements; read its usage policy first.
3. **Riot's official VCT schedule / broadcast VODs**: exact start times and which matches were played on which day.
4. **Your own logging (recommended going forward):** poll the Twitch Helix and YouTube Data APIs during broadcasts every few minutes and store the counts. Historical numbers are hard to get later, so start collecting now.
5. **Optional enrichments:** Google Trends interest per team, social follower counts, patch dates, and public holiday calendars per region.

Then set `source` to something honest (e.g. `EsportsCharts`) so nobody mistakes synthetic rows for real ones.

### Step 4 · Clean and validate
Before modelling, check: no duplicate matches; times all in UTC; team names normalised; viewership defined the same way for every row (same platforms, includes/excludes Chinese platforms consistently); no zero or missing peaks; forfeits or delayed matches flagged. Aim for at least a few hundred matches across 2+ seasons.

### Step 5 · Exploratory analysis (`python eda.py`)
Look at the four charts in `outputs/`:

1. **Distribution:** peaks are heavily right-skewed, which is why the model predicts `log(peak)`.
2. **Regional trend:** the "who is rising or falling" story.
3. **Phase uplift:** how much bigger are playoffs and finals than group play, per region?
4. **Hour-of-day profile:** each region has its own prime time; off-slot matches should suffer.

Write down 3-4 findings in plain English *before* you model. They become your report headline and your sanity check on the model.

### Step 6 · Engineer features (`src/features.py`)
The single most important rule: **only use information available before the match starts.** Concretely:

- `region_recent_level`: mean log-peak of the region's last 30 matches (momentum).
- `team_lift_a/b`: shrunken average over/under-performance of each team's last 8 matches versus the regional level at the time. This is a leakage-free "star power" measure. Shrinkage (`SHRINK_K`) stops a team with one lucky match from looking like a superstar.
- `draw_sum`, `draw_max`: combined and best team draw.
- `hour_off_usual`: how far the kick-off is from the region's usual slot.
- Calendar and format: weekday, weekend, Bo3/Bo5, phase, event.
- Context: co-stream count, competing-event flag.

Rows with a missing target (upcoming fixtures) receive features but never update the running state, so the *same code* trains the model and scores the future.

### Step 7 · Model with a time-aware split (`python train.py`)
Never shuffle. Train on earlier seasons, test on the latest one. The script compares:

1. **Baseline:** historical mean of log-peak per region × phase. Any model must beat this.
2. **Ridge regression:** interpretable, strong when effects are roughly multiplicative.
3. **Gradient boosting (`HistGradientBoostingRegressor`):** picks up interactions (e.g. region × hour).

It also runs **rolling-origin cross-validation** (`TimeSeriesSplit`) to check the score isn't a one-season fluke.

### Step 8 · Evaluate honestly
The script reports, for the held-out season: MAE in viewers, MAPE, R² on the log scale, and MAPE **by region**.

On the synthetic data, expect a modest gain over the baseline (about 28% vs 31% MAPE) because region and phase already explain most of the variance. That's a realistic pattern: the *interesting* question is what the extra features add. If real data shows a much larger gain, sanity-check for leakage.

**Prediction intervals:** a single number is misleading for something this volatile. The script builds 80% intervals from out-of-fold residuals (a conformal-style method) and checks empirical coverage on the test season (about 79% on the placeholder data).

### Step 9 · Interpret
`outputs/06_feature_importance.png` uses permutation importance: shuffle one feature and measure how much error grows. Answer your original question with it: how large is the region effect versus team, stage, and scheduling effects? Then check the model by region. Expect EMEA and any region with a recent structural shift to be hardest to predict.

### Step 10 · Forecast upcoming matches (`python predict.py`)
Edit `data/raw/upcoming_template.csv` with fixtures (dated after your last historical match) and run `predict.py`. You get `outputs/forecast.csv` with a point estimate and an 80% range per match.

### Step 11 · Communicate the result
Structure the write-up or dashboard as: (1) the question, (2) the regional story from EDA, (3) model vs baseline, (4) what drives viewership, (5) forecasts with ranges, (6) limitations (China measurement, co-stream data quality, small samples). A Streamlit or Tableau dashboard with a region selector and the forecast table is a good portfolio piece.

---

## Level up

- **Swap in LightGBM** and add SHAP values for per-match explanations ("why is this Paper Rex match forecast at 190K?").
- **Model event-level totals** (hours watched per event) with a second model; hours watched = average viewers × airtime, which explains why Americas Stage 2 hours rose while average viewers fell.
- **Language/platform breakdown:** predict English vs Japanese vs Thai vs Portuguese audiences separately; 2026 growth was concentrated in specific languages.
- **VALORANT Champions 2026 (Shanghai, Sept 24 - Oct 18):** extend the schema to international events. Add columns for each team's home region, the region-pair of a match, and whether the match is in an Asia-friendly time slot. Train on Masters + Champions history, using regional team lifts as inputs.
- **Causal question:** did a team's elimination change its region's viewership for the rest of the event? Try a difference-in-differences design around eliminations.

## Known limitations
Peak viewers is a noisy, platform-dependent metric; co-stream data is the hardest feature to collect historically; team draw is estimated from a small window; and structural changes (format changes, roster moves, viral players) can break relationships learned from earlier seasons. Always retrain each stage and monitor error by region.
