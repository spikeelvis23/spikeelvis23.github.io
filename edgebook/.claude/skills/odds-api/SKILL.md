---
name: odds-api
description: Use when working with live odds, The Odds API, API keys, credits, or the Cloudflare Worker that fetches and caches odds for EdgeBook.
---

# The Odds API in EdgeBook

## Endpoint
`GET https://api.the-odds-api.com/v4/sports/{sport}/odds/?regions=us&markets=h2h&oddsFormat=american&apiKey=KEY`
- Sports used: `americanfootball_nfl`, `basketball_nba`, `icehockey_nhl`, `baseball_mlb`, `americanfootball_ncaaf`
- The response is an array of events: `{ id, commence_time, home_team, away_team, bookmakers: [{ key, title, markets: [{ key, outcomes: [{ name, price }] }] }] }`
- In EdgeBook, side A = away team and side B = home team. A game is linked to its event by `game.apiId = event.id`.
- Response headers `x-requests-remaining` and `x-requests-used` show the credits.

## Credits
- Cost of one call = number of markets × number of regions. `h2h` + `us` = 1 credit.
- Adding `spreads,totals` makes each call cost 3. Player props are per event and cost more, so pull them only when someone asks.
- The free plan gives 500 credits a month. Never pull on a timer from the browser.

## Keeping the key safe
- Never put the key in `app.js`, `index.html` or any file in the repo.
- For now the browser keeps it in localStorage (`edgebook-apikey`).
- Target design: a Cloudflare Worker holds the key as a secret (`wrangler secret put ODDS_API_KEY`). The app calls the Worker, and the Worker calls The Odds API.

## Worker plan (roadmap step 1)
- Route: `GET /odds?sport=americanfootball_nfl`
- Only allow sport keys from a fixed list.
- Cache each sport's response for 10 minutes (Cache API or KV), so every user shares one fetch.
- Pass `x-requests-remaining` back to the app and add CORS headers for the app's address.
- In `app.js`, change `pullOdds()` to call the Worker URL. Keep the same error messages for 401, 429 and network failures.
- Test with `wrangler dev` before `wrangler deploy`.
