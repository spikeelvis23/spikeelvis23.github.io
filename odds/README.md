# Odds Board

A page that shows sports betting odds. Live at https://spikeelvis23.github.io/odds/ once this is merged to `main`.

## How it fits together

```
Your browser  ──>  Cloudflare Worker  ──>  The Odds API
 (app.js)          (holds the key,          (costs 1 credit
                    caches 10 min)           per call)
```

- **`index.html`, `style.css`, `app.js`**: the page. GitHub Pages hosts it for free. It has **no API key** in it.
- **`worker/`**: a tiny server that runs on Cloudflare (free plan). It keeps the key secret and remembers each answer for 10 minutes.

## One-time setup

You need [Node.js](https://nodejs.org) v18+ (check with `node -v`), a free [Cloudflare account](https://dash.cloudflare.com/sign-up), and a key from [the-odds-api.com](https://the-odds-api.com).

Run these from the `odds/worker` folder:

```bash
cd odds/worker
```

1. **Log in to Cloudflare.** A browser window opens; click Allow.
   ```bash
   npx wrangler login
   ```
2. **Create the cache storage (KV).**
   ```bash
   npx wrangler kv namespace create ODDS_CACHE
   ```
   It prints an `id = "..."`. Paste that id into `wrangler.toml`, replacing `PASTE_YOUR_KV_ID_HERE`.
3. **Store your API key as a secret.** It asks you to paste the key. It's saved on Cloudflare, never in your code.
   ```bash
   npx wrangler secret put ODDS_API_KEY
   ```
4. **Put the Worker online.**
   ```bash
   npx wrangler deploy
   ```
   It prints a URL like `https://odds-worker.yourname.workers.dev`.
5. **Test it.** Open `https://odds-worker.yourname.workers.dev/odds?sport=basketball_nba` in your browser. You should see JSON with `"cached": false`. Refresh, and it changes to `"cached": true`. That means the cache works and the refresh cost you nothing.
6. **Connect the page.** In `odds/app.js`, set `DEPLOYED_WORKER_URL` to your Worker URL. Then commit and push.

## Test on your own computer (optional)

```bash
cd odds/worker
cp .dev.vars.example .dev.vars      # then put your real key inside .dev.vars
npx wrangler dev                    # Worker runs at http://localhost:8787
```

In a second terminal:

```bash
cd odds
python3 -m http.server 8000         # page runs at http://localhost:8000
```

On localhost, `app.js` talks to the local Worker automatically. `.dev.vars` is in `.gitignore`, so your key won't be committed.

## Credits (cost)

The free Odds API plan has 500 credits/month. Each time the cache is empty (at most once per sport every 10 minutes) costs 1 credit. The Worker only allows the 6 sports in the dropdown, so strangers can't burn credits on other sports. Each response includes `requestsRemaining` so you can keep an eye on it.
