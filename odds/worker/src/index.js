// Odds Worker — a tiny server that runs on Cloudflare, not in the browser.
//
// Why it exists:
//   1. It holds your Odds API key as a secret. The browser never sees it.
//   2. It saves (caches) each answer for 10 minutes, so 100 page visits
//      cost 1 API credit instead of 100.
//
// The browser calls:   https://<your-worker>.workers.dev/odds?sport=basketball_nba
// The Worker calls:    https://api.the-odds-api.com/v4/sports/basketball_nba/odds?apiKey=SECRET...

const ODDS_API = 'https://api.the-odds-api.com/v4/sports';
const CACHE_SECONDS = 600; // 10 minutes

// Only these sports can be requested. This stops a stranger from asking for
// 70 different sports and burning through your monthly credits.
// Keep this list in sync with the <select> in ../index.html.
const ALLOWED_SPORTS = [
  'upcoming',
  'americanfootball_nfl',
  'basketball_nba',
  'baseball_mlb',
  'icehockey_nhl',
  'soccer_epl',
];

// Send back JSON with the right headers.
const json = (data, status, headers) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
  });

// CORS = the browser rule that says "a page on site A can only read answers
// from site B if site B says it's OK". We only say OK to the sites listed in
// ALLOWED_ORIGINS (set in wrangler.toml).
const corsHeaders = (request, env) => {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim());
  const origin = request.headers.get('Origin');
  const headers = { Vary: 'Origin' };
  if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
  }
  return headers;
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    // Browsers sometimes send a quick "may I?" OPTIONS request first.
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'GET') return json({ error: 'Only GET is allowed' }, 405, cors);
    if (url.pathname !== '/odds') return json({ error: 'Not found. Try /odds?sport=upcoming' }, 404, cors);

    const sport = url.searchParams.get('sport') || 'upcoming';
    if (!ALLOWED_SPORTS.includes(sport)) {
      return json({ error: `Unknown sport "${sport}"`, allowed: ALLOWED_SPORTS }, 400, cors);
    }

    if (!env.ODDS_API_KEY) {
      return json({ error: 'Worker is missing the ODDS_API_KEY secret' }, 500, cors);
    }

    // 1. Check the cache first (Cloudflare KV storage).
    const cacheKey = `odds:${sport}`;
    const saved = await env.ODDS_CACHE.get(cacheKey, 'json');
    if (saved) return json({ ...saved, cached: true }, 200, cors);

    // 2. Nothing saved (or it expired), so ask The Odds API.
    const apiUrl = new URL(`${ODDS_API}/${sport}/odds`);
    apiUrl.searchParams.set('apiKey', env.ODDS_API_KEY);
    apiUrl.searchParams.set('regions', 'us'); // US bookmakers
    apiUrl.searchParams.set('markets', 'h2h'); // moneyline (who wins)
    apiUrl.searchParams.set('oddsFormat', 'american'); // +150 / -200 style

    let apiRes;
    try {
      apiRes = await fetch(apiUrl);
    } catch {
      return json({ error: 'Could not reach The Odds API' }, 502, cors);
    }

    if (!apiRes.ok) {
      // Pass along their message, but never the key.
      const detail = (await apiRes.text()).replaceAll(env.ODDS_API_KEY, '***').slice(0, 300);
      return json({ error: `The Odds API answered ${apiRes.status}`, detail }, 502, cors);
    }

    const payload = {
      sport,
      fetchedAt: new Date().toISOString(),
      requestsRemaining: apiRes.headers.get('x-requests-remaining'),
      games: await apiRes.json(),
    };

    // 3. Save it. KV deletes it by itself after CACHE_SECONDS.
    await env.ODDS_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: CACHE_SECONDS });

    return json({ ...payload, cached: false }, 200, cors);
  },
};
