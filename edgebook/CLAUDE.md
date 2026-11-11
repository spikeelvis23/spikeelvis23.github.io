# EdgeBook: notes for Claude Code

## What this is
A mobile-first sports betting and fantasy helper: bet finder (no-vig fair price, EV, arbitrage, Kelly sizing),
bet tracker (profit, ROI, CLV, profit by bet type), parlay builder with copy text, prop checker,
start/sit ranker and a "How To" guide for beginners in Oregon.
The owner (Spike) is learning to code, and the goal is a paid web app.

## Stack
- Plain HTML/CSS/JS with no framework and no build step: `index.html`, `style.css`, `app.js`
- Run with VS Code Live Server
- Lives in the `edgebook/` folder of the `spikeelvis23.github.io` repo, so GitHub Pages serves it at https://spikeelvis23.github.io/edgebook/
- Data lives in localStorage (`edgebook-v1`). The Odds API key is stored separately (`edgebook-apikey`) and is never in code or backups
- Live odds come from The Odds API v4 (`/sports/{sport}/odds?regions=us&markets=h2h&oddsFormat=american`), currently called from the browser

## Code style (important)
- Modern JS only: `const`/`let`, arrow functions, `forEach`/`map`/`filter`, template literals
- Build DOM with the `el()` helper (createElement/append), not innerHTML with user text
- Explain changes in plain language. Spike is a beginner, so add short comments on tricky math
- Keep it mobile-first (390px wide) and keep the dark orange/pink gradient look

## Rules
- Never hardcode API keys or secrets
- Keep the honesty: no "guaranteed wins" copy, and keep the responsible-gambling notes (21+, 1-800-GAMBLER)
- Oregon: DraftKings is the only legal online sportsbook. Pick'em apps (PrizePicks, Underdog, Sleeper) are a legal gray area

## Project skills (.claude/skills/)
- `edgebook-feature`: how the app is built and how to add features
- `odds-api`: The Odds API, credits, key safety and the Worker plan
- `teach-spike`: how to explain things to Spike

## Roadmap
1. Cloudflare Worker that proxies and caches The Odds API (hides the key, shares one fetch across users)
2. Add spreads and totals markets and player props from the API
3. User accounts and a database (move off localStorage)
4. Stripe subscriptions (free tier and paid tier)
5. Deploy (Cloudflare Pages) and a custom domain
