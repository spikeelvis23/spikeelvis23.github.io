# Odds Board — instructions for Claude

Spike is learning to code. Explain changes in plain language, like to a beginner, and say exactly what to run.

## Structure
- `index.html`, `style.css`, `app.js`: static page, hosted by GitHub Pages at `/odds/`.
- `app.js` → `pullOdds(sport)` fetches `${WORKER_URL}/odds?sport=...` and renders game cards.
- `worker/`: Cloudflare Worker (`worker/src/index.js`, config in `worker/wrangler.toml`).
  - Secret `ODDS_API_KEY` (set with `npx wrangler secret put`), KV binding `ODDS_CACHE` (10-minute cache).
  - `ALLOWED_ORIGINS` in `wrangler.toml` controls which sites may call it (CORS).

## Rules
- **Never put the API key in the frontend or in any committed file.** Only the Worker reads it.
- The sport list lives in two places: `ALLOWED_SPORTS` in `worker/src/index.js` and the `<select>` in `index.html`. Change both together.
- No npm dependencies in the page. Plain HTML, CSS, JS.
- Modern JS: `const`/`let`, arrow functions, `fetch`, `createElement`/`textContent`. No `innerHTML` with data.
- Mobile-first; reuse the color tokens in `style.css`.

## Roadmap
1. ✅ Cloudflare Worker that fetches The Odds API, caches 10 minutes, keeps the key secret; `pullOdds()` calls it.
2. _(add next steps here)_
