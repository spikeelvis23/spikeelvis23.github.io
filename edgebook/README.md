# EdgeBook

Bet finder, bet tracker, parlay builder, prop checker and start/sit helper.
Plain HTML, CSS and JavaScript, no build step.

## Files
- `index.html`: page layout (screens, tabs, pop-up sheets)
- `style.css`: all the styling
- `app.js`: all the logic (math, saving, live odds, rendering)

Live at https://spikeelvis23.github.io/edgebook/ (GitHub Pages).

## Run it in VS Code
1. Open this folder: File → Open Folder → `edgebook`
2. Install the **Live Server** extension (by Ritwick Dey)
3. Right-click `index.html` → **Open with Live Server**
4. It opens at `http://127.0.0.1:5500`, and it reloads every time you save

## Live odds (free tier)
1. Get a free key at https://the-odds-api.com (Starter plan, 500 credits/month)
2. In the app: ⚙️ → paste the key into "Odds API key"
3. Bet Finder → pick a sport → ⚡ Get live odds (about 1 credit per tap)

The key is saved in your browser only (localStorage), never in the code.
Don't paste it into `app.js`, especially before pushing to GitHub.

## Where things live in app.js
- `analyze()`: removes the vig, finds the fair price, edge and arbitrage
- `kellyStake()`: bet sizing
- `pullOdds()`: live odds from The Odds API
- `renderParlay()`: parlay builder and copy text
- `checkProp()`: prop checker (More/Less chance)
- `renderTracker()`: stats, profit by bet type, CLV

## Data
Saved in the browser (localStorage) under `edgebook-v1`.
Use ⚙️ → Copy backup to move your data between devices.
