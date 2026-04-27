# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project does

Web app that monitors airline loyalty program promotion pages (Azul Fidelidade, LATAM Pass, Smiles/GOL) and sends email alerts when promotions exceed configured thresholds — e.g., "80% bonus on purchased miles" or a points-to-miles ratio ≥ 2.0.

## Commands

```bash
npm install          # install dependencies
npm run scrape       # run the scraper manually (requires GMAIL_USER/GMAIL_PASS env vars for email)
npm run dev          # serve the frontend locally at http://localhost:3000
```

## Architecture

```
GitHub Actions (cron, every 6h)
  └─ node scraper/index.js
        ├─ scraper/airlines/azul.js    ← axios + cheerio scraper
        ├─ scraper/airlines/latam.js
        ├─ scraper/airlines/smiles.js
        └─ scraper/notify.js           ← nodemailer / Gmail SMTP
              ↓ writes
        public/data/promotions.json    ← committed back to repo
              ↓ triggers
        Vercel redeploy (static site)
              ↓ served as
        public/index.html + app.js     ← reads promotions.json via fetch()
```

**No external database.** Data lives in `public/data/promotions.json`, which GitHub Actions updates and commits on every run.

## Key files

| File | Purpose |
|------|---------|
| `config/settings.json` | Thresholds, airlines list, notification email |
| `public/data/promotions.json` | Output written by the scraper, read by the frontend |
| `scraper/index.js` | Orchestrates all scrapers, applies threshold filtering, detects new promotions |
| `.github/workflows/monitor.yml` | Cron schedule, runs scraper, commits results, pushes |

## Adding a new airline

1. Create `scraper/airlines/<name>.js` — export an async function returning an array of `{ airline, airlineName, type, value, title, url }`.
2. Add the module to the `scrapers` map in `scraper/index.js`.
3. Add the key to `config/settings.json → airlines[]`.

## Promotion object schema

```js
{
  airline: 'azul',           // key matching scrapers map
  airlineName: 'Azul Fidelidade',
  type: 'bonus_percentage',  // or 'ratio'
  value: 80,                 // number: % for bonus_percentage, decimal for ratio (e.g. 2.0)
  title: '80% de bônus...',
  url: 'https://...',
  foundAt: '<ISO timestamp>',
  isNew: true,               // added by index.js — true if not seen in previous run
}
```

## Threshold logic

`config/settings.json → thresholds`:
- `bonusPercentage`: alert if `promotion.value >= N` (for `type: bonus_percentage`)
- `pointsToMilesRatio`: alert if `promotion.value >= N` (for `type: ratio`)

## Deployment

- **Frontend**: Vercel — connect to the GitHub repo, it auto-deploys on every push.
- **Scraper**: GitHub Actions — no extra setup needed beyond repo secrets.

## Required GitHub Secrets

Set in `Settings → Secrets and variables → Actions`:

| Secret | Value |
|--------|-------|
| `GMAIL_USER` | Gmail address used to send alerts |
| `GMAIL_PASS` | Gmail App Password (not the account password — enable 2FA first, then create an App Password at myaccount.google.com/apppasswords) |

## Scraper limitation

Airlines use heavily JavaScript-rendered pages. `axios + cheerio` only processes static HTML. If a scraper returns zero results consistently, the page likely requires a headless browser. To add Puppeteer support, install `puppeteer` as a dev dependency and replace the `axios.get` call in that scraper; Puppeteer runs fine on the GitHub Actions Ubuntu runner.
