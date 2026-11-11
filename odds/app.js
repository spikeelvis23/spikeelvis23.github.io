// Odds Board — the part that runs in the browser.
// It never talks to The Odds API directly. It asks YOUR Worker, which holds the key.

// After you deploy the Worker (README step 6), paste its URL here.
const DEPLOYED_WORKER_URL = 'https://odds-worker.YOUR-SUBDOMAIN.workers.dev';

// When you test on your own computer, use the local Worker from `npx wrangler dev`.
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
const WORKER_URL = isLocal ? 'http://localhost:8787' : DEPLOYED_WORKER_URL;

const sportSelect = document.querySelector('#sport');
const refreshButton = document.querySelector('#refresh');
const statusEl = document.querySelector('#status');
const gamesEl = document.querySelector('#games');

// American odds: positive numbers get a "+" in front (e.g. +150).
const formatPrice = (price) => (price > 0 ? `+${price}` : `${price}`);

const formatStart = (isoTime) =>
  new Date(isoTime).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });

const minutesAgo = (isoTime) => Math.round((Date.now() - new Date(isoTime)) / 60000);

// Build one card for one game: a small table of bookmakers and their prices.
const renderGame = (game) => {
  const teams = [game.away_team, game.home_team];

  const card = document.createElement('article');
  card.className = 'game';

  const title = document.createElement('h2');
  title.textContent = `${game.away_team} @ ${game.home_team}`;

  const time = document.createElement('p');
  time.className = 'game-time';
  time.textContent = `${game.sport_title} · ${formatStart(game.commence_time)}`;

  card.append(title, time);

  // For each bookmaker, find the moneyline price for each team.
  const rows = game.bookmakers
    .map((book) => {
      const market = book.markets.find((m) => m.key === 'h2h');
      if (!market) return null;
      const prices = teams.map((team) => market.outcomes.find((o) => o.name === team)?.price);
      return { name: book.title, prices };
    })
    .filter(Boolean);

  if (rows.length === 0) {
    const none = document.createElement('p');
    none.textContent = 'No odds posted yet.';
    card.appendChild(none);
    return card;
  }

  // The best price for a bettor is the highest number (+200 beats +150, -110 beats -150).
  const best = teams.map((_, i) => Math.max(...rows.map((row) => row.prices[i] ?? -Infinity)));

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap'; // lets the table scroll sideways on small phones
  const table = document.createElement('table');

  const headRow = document.createElement('tr');
  ['Book', ...teams].forEach((label) => {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  });
  table.appendChild(headRow);

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent = row.name;
    tr.appendChild(nameCell);

    row.prices.forEach((price, i) => {
      const td = document.createElement('td');
      td.textContent = price === undefined ? '–' : formatPrice(price);
      if (price === best[i]) td.className = 'best';
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  wrap.appendChild(table);
  card.appendChild(wrap);
  return card;
};

// Ask the Worker for odds and draw them on the page.
const pullOdds = async (sport) => {
  statusEl.textContent = 'Loading odds…';
  refreshButton.disabled = true;
  gamesEl.replaceChildren();

  try {
    const res = await fetch(`${WORKER_URL}/odds?sport=${encodeURIComponent(sport)}`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || `Worker error ${res.status}`);

    if (body.games.length === 0) {
      statusEl.textContent = 'No upcoming games for this sport right now.';
      return;
    }

    body.games.forEach((game) => gamesEl.appendChild(renderGame(game)));

    const age = minutesAgo(body.fetchedAt);
    statusEl.textContent = `${body.games.length} games · updated ${age < 1 ? 'just now' : `${age} min ago`}`;
  } catch (err) {
    statusEl.textContent = `Couldn't load odds: ${err.message}`;
  } finally {
    refreshButton.disabled = false;
  }
};

sportSelect.addEventListener('change', () => pullOdds(sportSelect.value));
refreshButton.addEventListener('click', () => pullOdds(sportSelect.value));

pullOdds(sportSelect.value);
