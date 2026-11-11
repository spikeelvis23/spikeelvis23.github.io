// ================= helpers =================
const $ = (sel) => document.querySelector(sel);

const el = (tag, props = {}, ...kids) => {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, val]) => {
    if (val === undefined || val === null) return;
    if (key.startsWith("on")) node.addEventListener(key.slice(2), val);
    else if (key === "class") node.className = val;
    // real properties (value, type, readOnly...) are set directly.
    // Anything else (inputmode, aria-label) has to be an HTML attribute.
    else if (key in node) node[key] = val;
    else node.setAttribute(key, val);
  });
  kids.flat().forEach((kid) => {
    if (kid === null || kid === undefined || kid === false) return;
    node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  });
  return node;
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const money = (n) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;
const pct = (n) => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(1)}%`;
const isOdds = (o) => Number.isFinite(o) && Math.abs(o) >= 100;
const toDecimal = (o) => (o > 0 ? 1 + o / 100 : 1 + 100 / -o);
const fmtOdds = (o) => (o > 0 ? `+${o}` : `${o}`);
const toWin = (odds, stake) => stake * (toDecimal(odds) - 1);
const toAmerican = (dec) => Math.round(dec >= 2 ? (dec - 1) * 100 : -100 / (dec - 1));

// bell-curve math for props
const erf = (x) => {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
};
const normCdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));

// bet types + closing line value
const BET_TYPES = ["Moneyline", "Spread", "Total", "Prop", "Parlay", "Other"];
const guessType = (pick = "") => {
  if (/parlay/i.test(pick)) return "Parlay";
  if (/\bML\b|moneyline/i.test(pick)) return "Moneyline";
  if (/^(o|u|over|under)\s?\d/i.test(pick) || /\b(over|under)\b/i.test(pick)) return "Total";
  if (/\b(more|less|yds|yards|catches|receptions|pts)\b/i.test(pick)) return "Prop";
  if (/[+-]\d+(\.5)?\s*$/.test(pick)) return "Spread";
  return "Other";
};
const betType = (bet) => bet.type || guessType(bet.pick);
const clvOf = (bet) => (isOdds(bet.close) ? toDecimal(bet.odds) / toDecimal(bet.close) - 1 : null);

const toast = (msg, ms = 2000) => {
  const t = el("div", { class: "toast", style: ms > 2500 ? "border-radius:16px;max-width:88vw;text-align:center;font-weight:600" : "" }, msg);
  $("#toasts").replaceChildren(t);
  setTimeout(() => t.classList.add("out"), ms);
  setTimeout(() => t.remove(), ms + 400);
};

// plain-language explainers
const TIPS = {
  edge: "Edge (EV) = how much more the book pays than the bet is really worth. +3% means about $3 profit per $100 bet over the long run.",
  fair: "Fair chance = each book's odds with its built-in fee removed, then averaged together.",
  clv: "CLV = your odds vs the odds right before kickoff. Beating the closing line regularly is the best sign you're betting smart.",
  kelly: "Suggested bet comes from the Kelly formula, scaled down so a bad week can't wipe out your bankroll.",
};
const info = (key) => el("button", { class: "info", "aria-label": "What does this mean?", onclick: (e) => { e.stopPropagation(); toast(TIPS[key], 5000); } }, "i");

const confetti = () => {
  const bits = ["💰", "🎉", "💵", "✨", "🔥"];
  for (let i = 0; i < 22; i++) {
    const c = el("span", { class: "confetti" }, bits[i % bits.length]);
    c.style.left = `${Math.random() * 100}vw`;
    c.style.animationDelay = `${Math.random() * 0.4}s`;
    c.style.fontSize = `${16 + Math.random() * 16}px`;
    document.body.append(c);
    setTimeout(() => c.remove(), 2200);
  }
};

const countUp = (node, to, fmt) => {
  const from = Number(node.dataset.val || 0);
  node.dataset.val = to;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / 700);
    const eased = 1 - Math.pow(1 - t, 3);
    node.textContent = fmt(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

// ================= NFL team colors (badges, not logos) =================
const TEAMS = [
  ["ARI", "Arizona", "Cardinals", "#97233F", "#FFB612"], ["ATL", "Atlanta", "Falcons", "#A71930", "#000000"],
  ["BAL", "Baltimore", "Ravens", "#241773", "#9E7C0C"], ["BUF", "Buffalo", "Bills", "#00338D", "#C60C30"],
  ["CAR", "Carolina", "Panthers", "#0085CA", "#101820"], ["CHI", "Chicago", "Bears", "#0B162A", "#C83803"],
  ["CIN", "Cincinnati", "Bengals", "#FB4F14", "#000000"], ["CLE", "Cleveland", "Browns", "#311D00", "#FF3C00"],
  ["DAL", "Dallas", "Cowboys", "#003594", "#869397"], ["DEN", "Denver", "Broncos", "#FB4F14", "#002244"],
  ["DET", "Detroit", "Lions", "#0076B6", "#B0B7BC"], ["GB", "Green Bay", "Packers", "#203731", "#FFB612"],
  ["HOU", "Houston", "Texans", "#03202F", "#A71930"], ["IND", "Indianapolis", "Colts", "#002C5F", "#A2AAAD"],
  ["JAX", "Jacksonville", "Jaguars", "#006778", "#D7A22A"], ["KC", "Kansas City", "Chiefs", "#E31837", "#FFB81C"],
  ["LV", "Las Vegas", "Raiders", "#000000", "#A5ACAF"], ["LAC", "Los Angeles", "Chargers", "#0080C6", "#FFC20E"],
  ["LAR", "Los Angeles", "Rams", "#003594", "#FFA300"], ["MIA", "Miami", "Dolphins", "#008E97", "#FC4C02"],
  ["MIN", "Minnesota", "Vikings", "#4F2683", "#FFC62F"], ["NE", "New England", "Patriots", "#002244", "#C60C30"],
  ["NO", "New Orleans", "Saints", "#101820", "#D3BC8D"], ["NYG", "New York", "Giants", "#0B2265", "#A71930"],
  ["NYJ", "New York", "Jets", "#125740", "#FFFFFF"], ["PHI", "Philadelphia", "Eagles", "#004C54", "#A5ACAD"],
  ["PIT", "Pittsburgh", "Steelers", "#101820", "#FFB612"], ["SF", "San Francisco", "49ers", "#AA0000", "#B3995D"],
  ["SEA", "Seattle", "Seahawks", "#002244", "#69BE28"], ["TB", "Tampa Bay", "Buccaneers", "#D50A0A", "#34302B"],
  ["TEN", "Tennessee", "Titans", "#0C2340", "#4B92DB"], ["WAS", "Washington", "Commanders", "#5A1414", "#FFB612"],
].map(([abbr, city, nick, c1, c2]) => ({ abbr, city, nick, c1, c2 }));

const findTeam = (text = "") => {
  const lower = text.toLowerCase();
  const byNick = TEAMS.find((t) => lower.includes(t.nick.toLowerCase())
    || (t.abbr === "SF" && lower.includes("niners")) || (t.abbr === "TB" && lower.includes("bucs")));
  if (byNick) return byNick;
  const tokens = text.split(/[^A-Za-z]+/);
  return TEAMS.find((t) => tokens.includes(t.abbr) && t.abbr !== "NO") || null;
};

// Team colors are NFL only. Without this check, NHL Panthers, MLB Giants or NHL Jets
// would get an NFL team's badge.
const teamFor = (text, sport) => (!sport || sport === "americanfootball_nfl" ? findTeam(text) : null);

const badge = (team, big = false, fallback = null) => {
  if (!team) return fallback ? el("span", { class: `badge blank${big ? " lg" : ""}` }, fallback) : null;
  const textColor = team.c2 === "#FFFFFF" || team.c1 === "#000000" ? "#fff" : team.c2;
  return el("span", {
    class: `badge${big ? " lg" : ""}`,
    title: `${team.city} ${team.nick}`,
    style: `background:${team.c1};border-color:${team.c2};color:${textColor}`,
  }, team.abbr);
};

// ================= state + saving =================
const LS_KEY = "edgebook-v1";
const DEFAULTS = { bankroll: 500, kelly: 0.25, slots: 1, weeklyLimit: 50, myBooks: "DraftKings", parlay: {}, games: [], bets: [], players: [], props: [], onboarded: false, bankrollSet: false, learnSeen: false };
// A brand-new copy every time, so editing state never changes DEFAULTS itself
const freshState = () => structuredClone(DEFAULTS);
let state = freshState();
let stateDoc = null;
let writeChain = Promise.resolve();
let saveTimer;

const setSync = (msg) => { $("#sync").textContent = msg; };

try {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) state = { ...freshState(), ...JSON.parse(raw) };
} catch (e) { /* storage unavailable */ }

const save = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const snapshot = JSON.parse(JSON.stringify(state));
    try { localStorage.setItem(LS_KEY, JSON.stringify(snapshot)); } catch (e) { /* ignore */ }
    if (!stateDoc) return;
    writeChain = writeChain
      .then(() => stateDoc.set(snapshot))
      .then(() => setSync("Synced to your account"))
      .catch(() => setSync("Saved on this device only"));
  }, 500);
};

const commit = () => { save(); refresh(); };

// ================= navigation + sheets =================
const VIEWS = ["home", "finder", "tracker", "lineup", "learn"];
const showView = () => {
  const name = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";
  VIEWS.forEach((v) => {
    $(`#view-${v}`).classList.toggle("active", v === name);
    document.querySelector(`nav a[data-view="${v}"]`).classList.toggle("active", v === name);
  });
  window.scrollTo(0, 0);
  if (name === "learn" && !state.learnSeen) { state.learnSeen = true; commit(); }
};
window.addEventListener("hashchange", showView);

const go = (view, scrollId) => {
  location.hash = view;
  if (scrollId) setTimeout(() => $(`#${scrollId}`)?.scrollIntoView({ behavior: "smooth" }), 80);
};

const openSheet = (id) => {
  $(`#${id}`).classList.add("open");
  if (id === "sheet-settings") fillSettings();
};
const closeSheets = () => document.querySelectorAll(".sheet.open").forEach((s) => s.classList.remove("open"));

document.querySelectorAll(".sheet").forEach((sheet) => {
  sheet.addEventListener("click", (e) => {
    if (e.target === sheet || e.target.closest("[data-close]")) closeSheets();
  });
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheets(); });
document.addEventListener("click", (e) => {
  const opener = e.target.closest("[data-open]");
  if (opener) openSheet(opener.dataset.open);
  const tipBtn = e.target.closest("[data-tip]");
  if (tipBtn) toast(TIPS[tipBtn.dataset.tip], 5000);
  const goer = e.target.closest("[data-go]");
  if (goer) go(goer.dataset.go, goer.dataset.scroll);
});

const emptyState = (icon, text, btnText, onClick) =>
  el("div", { class: "card empty" }, el("div", { class: "ei" }, icon), el("p", {}, text),
    btnText ? el("button", { class: "btn small", onclick: onClick }, btnText) : null);

// ================= math =================
const analyze = (game) => {
  const rows = game.books.filter((r) => isOdds(r.oa) && isOdds(r.ob));
  if (!rows.length) return null;

  // remove each book's vig, then average into a fair probability
  const fairA = rows
    .map((r) => {
      const ia = 1 / toDecimal(r.oa);
      const ib = 1 / toDecimal(r.ob);
      return ia / (ia + ib);
    })
    .reduce((sum, p) => sum + p, 0) / rows.length;
  const fairB = 1 - fairA;

  // only recommend prices at books you can actually bet at
  const mine = (state.myBooks || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const usable = rows.filter((r) => !mine.length || mine.includes((r.book || "").trim().toLowerCase()));
  const noMyBook = !usable.length;
  const pool = noMyBook ? rows : usable;

  const bestA = pool.reduce((best, r) => (toDecimal(r.oa) > toDecimal(best.oa) ? r : best));
  const bestB = pool.reduce((best, r) => (toDecimal(r.ob) > toDecimal(best.ob) ? r : best));
  const decA = toDecimal(bestA.oa);
  const decB = toDecimal(bestB.ob);

  return { rows, fairA, fairB, bestA, bestB, decA, decB, evA: fairA * decA - 1, evB: fairB * decB - 1, arbSum: 1 / decA + 1 / decB, noMyBook };
};

const kellyStake = (prob, dec) => {
  const b = dec - 1;
  const f = (b * prob - (1 - prob)) / b;
  return Math.max(0, f) * state.kelly * state.bankroll;
};

const allLegs = () => {
  const legs = [];
  state.games.forEach((game) => {
    const a = analyze(game);
    if (!a) return;
    legs.push({ key: `${game.id}:A`, gameId: game.id, sport: game.sport, game: game.name, side: game.a, book: a.bestA.book, odds: a.bestA.oa, dec: a.decA, prob: a.fairA, ev: a.evA });
    legs.push({ key: `${game.id}:B`, gameId: game.id, sport: game.sport, game: game.name, side: game.b, book: a.bestB.book, odds: a.bestB.ob, dec: a.decB, prob: a.fairB, ev: a.evB });
  });
  return legs;
};

const betProfit = (bet) => {
  if (bet.result === "won") return toWin(bet.odds, bet.stake);
  if (bet.result === "lost") return -bet.stake;
  return 0;
};

const weekStart = () => {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
};

const getStats = () => {
  const settled = state.bets.filter((b) => b.result !== "pending");
  const pending = state.bets.filter((b) => b.result === "pending");
  const profit = settled.reduce((sum, b) => sum + betProfit(b), 0);
  const risked = settled.filter((b) => b.result !== "push").reduce((sum, b) => sum + b.stake, 0);
  const wk = weekStart();
  let running = 0;
  const curve = [0, ...[...settled].sort((x, y) => (x.date < y.date ? -1 : 1)).map((b) => (running += betProfit(b)))];
  return {
    profit, risked, curve, pending,
    roi: risked ? profit / risked : null,
    wins: settled.filter((b) => b.result === "won").length,
    losses: settled.filter((b) => b.result === "lost").length,
    pushes: settled.filter((b) => b.result === "push").length,
    exposure: pending.reduce((sum, b) => sum + b.stake, 0),
    weekStaked: state.bets.filter((b) => new Date(b.date) >= wk).reduce((sum, b) => sum + b.stake, 0),
    clvs: state.bets.map(clvOf).filter((c) => c !== null),
  };
};

// ================= actions =================
const logBet = (pick, book, odds, stake, type, sport) => {
  state.bets.unshift({ id: uid(), pick, book, odds, stake: Math.round(stake * 100) / 100, type: type || guessType(pick), sport, result: "pending", date: new Date().toISOString() });
  commit();
  toast("📒 Bet logged");
};

const setResult = (bet, result) => {
  bet.result = result;
  commit();
  if (result === "won") { toast(`💰 Winner! +${money(toWin(bet.odds, bet.stake))}`); confetti(); $("#h-profit").classList.remove("bump"); void $("#h-profit").offsetWidth; $("#h-profit").classList.add("bump"); }
  if (result === "lost") toast("Logged. On to the next one.");
  if (result === "push") toast("Push: stake back");
};

const betRow = (bet, compact = false) => {
  const p = betProfit(bet);
  return el("li", {},
    el("div", { class: "li-top" },
      el("div", { class: "who" }, badge(teamFor(bet.pick, bet.sport), false, "🎟️"),
        el("div", { style: "min-width:0" }, el("strong", {}, bet.pick),
          el("div", { class: "muted" }, `${betType(bet)} · ${bet.book ? bet.book + " · " : ""}${fmtOdds(bet.odds)} · ${money(bet.stake)} → ${money(toWin(bet.odds, bet.stake))}`))),
      bet.result === "pending" ? el("span", { class: "pill" }, "pending")
        : el("div", { style: "text-align:right" }, el("span", { class: `pill ${bet.result}` }, bet.result),
          el("div", { class: `edge ${p > 0 ? "pos" : p < 0 ? "neg" : ""}`, style: "margin-top:4px" }, money(p)))),
    el("div", { class: "li-actions" },
      bet.result === "pending"
        ? [el("button", { class: "btn small good", onclick: () => setResult(bet, "won") }, "✓ Won"),
           el("button", { class: "btn small bad", onclick: () => setResult(bet, "lost") }, "✕ Lost"),
           el("button", { class: "btn small ghost", onclick: () => setResult(bet, "push") }, "Push")]
        : el("button", { class: "btn small ghost", onclick: () => setResult(bet, "pending") }, "Undo"),
      compact ? null : clvControl(bet),
      compact ? null : el("button", { class: "btn small ghost", onclick: () => { state.bets = state.bets.filter((b) => b !== bet); commit(); } }, "Delete")),
    !compact && openClv === bet.id ? el("div", { class: "clv-input" },
      el("input", { type: "number", inputmode: "numeric", placeholder: "Closing odds, ex: -125", value: bet.close ?? "", id: `clv-${bet.id}` }),
      el("button", { class: "btn small", onclick: () => {
        const v = Number($(`#clv-${bet.id}`).value);
        if (!isOdds(v)) { toast("Enter odds like -125 or +140"); return; }
        bet.close = v;
        openClv = null;
        commit();
        const c = clvOf(bet);
        toast(c > 0 ? `✅ Beat the close by ${pct(c)}` : c < 0 ? `Closing line was better by ${pct(-c)}` : "Same as the closing line");
      } }, "Save")) : null);
};

let openClv = null;
const clvControl = (bet) => {
  const c = clvOf(bet);
  if (c === null) return el("button", { class: "btn small ghost", onclick: () => { openClv = openClv === bet.id ? null : bet.id; renderTracker(); } }, "+ Closing odds");
  return el("button", { class: `btn small ghost`, onclick: () => { openClv = openClv === bet.id ? null : bet.id; renderTracker(); } },
    "CLV ", el("b", { class: c > 0 ? "pos" : c < 0 ? "neg" : "" }, pct(c)));
};

// ================= HOME =================
const renderSpark = (curve) => {
  const svg = $("#h-spark");
  if (curve.length < 3) {
    svg.innerHTML = `<text x="150" y="38" text-anchor="middle" fill="rgba(255,255,255,.75)" font-size="12" font-family="Outfit, sans-serif">Settle a few bets to see your profit line</text>`;
    return;
  }
  const min = Math.min(...curve, 0);
  const max = Math.max(...curve, 0);
  const span = max - min || 1;
  const pts = curve.map((v, i) => [(i / (curve.length - 1)) * 300, 58 - ((v - min) / span) * 52]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const zeroY = (58 - ((0 - min) / span) * 52).toFixed(1);
  svg.innerHTML = `
    <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <line x1="0" x2="300" y1="${zeroY}" y2="${zeroY}" stroke="rgba(255,255,255,.35)" stroke-dasharray="4 4" stroke-width="1"/>
    <path d="${line} L300,64 L0,64 Z" fill="url(#sg)"/>
    <path d="${line}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${pts[pts.length - 1][0].toFixed(1)}" cy="${pts[pts.length - 1][1].toFixed(1)}" r="4" fill="#fff"/>`;
};

const renderHome = () => {
  const s = getStats();
  countUp($("#h-profit"), s.profit, money);
  $("#h-roi").textContent = s.roi === null ? "ROI —" : `ROI ${pct(s.roi)}`;
  $("#h-record").textContent = `${s.wins}-${s.losses}-${s.pushes}`;
  $("#h-pending").textContent = `${s.pending.length} pending`;
  const clvPill = $("#h-clv");
  if (s.clvs.length) {
    clvPill.style.display = "";
    clvPill.textContent = `CLV ${pct(s.clvs.reduce((a, b) => a + b, 0) / s.clvs.length)}`;
  } else clvPill.style.display = "none";
  $("#bankroll-chip").textContent = `💵 ${money(state.bankroll)}`;
  renderSpark(s.curve);

  const limit = state.weeklyLimit || 0;
  const used = limit ? s.weekStaked / limit : 0;
  $("#week-text").textContent = limit ? `${money(s.weekStaked)} of ${money(limit)} limit` : `${money(s.weekStaked)} staked`;
  const bar = $("#week-bar");
  bar.style.width = `${Math.min(100, used * 100)}%`;
  bar.classList.toggle("over", used >= 1);

  // best bets
  const best = allLegs().filter((l) => l.ev > 0.005).sort((x, y) => y.ev - x.ev).slice(0, 3);
  const bestWrap = $("#home-best");
  bestWrap.replaceChildren();
  if (!best.length) {
    bestWrap.append(emptyState("🎯", state.games.length ? "No edges in your games right now. That's normal, and passing is a win." : "Add a game's odds and EdgeBook will find the best bet.",
      state.games.length ? "Open Bet Finder" : "Add a game", () => (state.games.length ? go("finder") : openSheet("sheet-game"))));
  } else {
    const list = el("ul", { class: "list", style: "margin-top:0" });
    best.forEach((leg) => {
      const stake = kellyStake(leg.prob, leg.dec);
      list.append(el("li", {},
        el("div", { class: "li-top" },
          el("div", { class: "who" }, badge(teamFor(leg.side, leg.sport), false, "🎯"),
            el("div", { style: "min-width:0" }, el("strong", {}, leg.side), el("div", { class: "muted" }, `${leg.book} ${fmtOdds(leg.odds)} · bet ${money(stake)}`))),
          el("div", { style: "text-align:right" }, el("div", { class: "edge pos" }, pct(leg.ev)), el("div", { class: "muted", style: "font-size:11px" }, "edge"))),
        el("div", { class: "li-actions" }, el("button", { class: "btn small", onclick: () => logBet(leg.side, leg.book, leg.odds, stake, undefined, leg.sport) }, "Log this bet"))));
    });
    bestWrap.append(list);
  }

  // pending
  const pendWrap = $("#home-pending");
  pendWrap.replaceChildren();
  if (!s.pending.length) {
    pendWrap.append(emptyState("⏳", "No open bets. When you place one, log it and settle it here.", "Log a bet", () => openSheet("sheet-bet")));
  } else {
    pendWrap.append(el("ul", { class: "list", style: "margin-top:0" }, s.pending.slice(0, 3).map((b) => betRow(b, true))));
  }
};

// ================= WELCOME =================
const renderWelcome = () => {
  const wrap = $("#welcome");
  wrap.replaceChildren();
  if (state.onboarded) return;
  const steps = [
    { icon: "💵", title: "Set your bankroll", sub: "The money you're OK betting with. Bets get sized from it.", done: state.bankrollSet, act: () => openSheet("sheet-settings") },
    { icon: "⚡", title: "Get odds", sub: getKey() ? "Load live games in Bet Finder." : "Add a free API key in ⚙️ or try sample games.", done: state.games.length > 0, act: () => (getKey() ? go("finder") : openSheet("sheet-game")) },
    { icon: "📝", title: "Log your first bet", sub: "Tracking every bet shows you the truth.", done: state.bets.length > 0, act: () => openSheet("sheet-bet") },
    { icon: "📘", title: "Learn the basics", sub: "Odds, bet types and where to play, in 2 minutes.", done: state.learnSeen, act: () => go("learn") },
  ];
  wrap.append(el("div", { class: "card welcome" },
    el("div", { class: "head" }, el("h2", {}, "👋 Welcome to EdgeBook"), el("button", { class: "link-btn", onclick: () => { state.onboarded = true; commit(); } }, "Hide")),
    el("p", { class: "muted", style: "margin:4px 0 4px" }, "Four quick steps and you're set."),
    steps.map((st) => el("div", { class: `step${st.done ? " done" : ""}`, onclick: st.act },
      el("span", { class: "si" }, st.icon), el("div", {}, el("strong", {}, st.title), el("div", { class: "muted" }, st.sub))))));
};

// ================= BET FINDER =================
const renderVerdict = (game, a) => {
  if (!a) return el("div", { class: "verdict" }, el("span", { class: "muted" }, "Tap \"Odds\" below and type both sides' odds from at least one book."));

  const fair = el("div", { class: "muted", style: "margin-top:6px" },
    `Fair win chance: ${game.a} ${(a.fairA * 100).toFixed(1)}% · ${game.b} ${(a.fairB * 100).toFixed(1)}%`, info("fair"),
    a.rows.length < 3 ? el("div", { style: "margin-top:2px" }, `Only ${a.rows.length} book${a.rows.length > 1 ? "s" : ""} entered. 3+ gives a sharper fair price.`) : null,
    a.noMyBook ? el("div", { style: "color:var(--warn);margin-top:4px" }, `None of these are your books (${state.myBooks}). Add your book's odds, or change your books in ⚙️.`) : null);

  if (a.arbSum < 1 && a.bestA !== a.bestB) {
    const total = Math.min(state.bankroll * 0.2, 200);
    const stakeA = total * (1 / a.decA) / a.arbSum;
    const stakeB = total - stakeA;
    return el("div", { class: "verdict arb" },
      el("span", { class: "tag", style: "background:var(--warn)" }, "⚡ ARBITRAGE"),
      el("div", { class: "main" }, `Bet both sides, profit either way`),
      el("div", { style: "margin-top:4px" }, `${money(stakeA)} on ${game.a} at ${a.bestA.book} (${fmtOdds(a.bestA.oa)}) + ${money(stakeB)} on ${game.b} at ${a.bestB.book} (${fmtOdds(a.bestB.ob)})`),
      el("div", { class: "pos", style: "margin-top:4px;font-weight:800" }, `About ${money(stakeA * a.decA - total)} profit (${pct(1 / a.arbSum - 1)}) if both bets go through at these odds`),
      el("div", { class: "muted", style: "margin-top:4px" }, "Odds move fast, so place both bets right away. Books can limit accounts that do this a lot."),
      fair);
  }

  const sides = [
    { name: game.a, ev: a.evA, prob: a.fairA, dec: a.decA, book: a.bestA.book, odds: a.bestA.oa },
    { name: game.b, ev: a.evB, prob: a.fairB, dec: a.decB, book: a.bestB.book, odds: a.bestB.ob },
  ];
  const top = sides[0].ev >= sides[1].ev ? sides[0] : sides[1];

  if (top.ev > 0.005) {
    const stake = kellyStake(top.prob, top.dec);
    return el("div", { class: "verdict go" },
      el("span", { class: "tag", style: "background:var(--good)" }, "🔥 BEST BET"),
      el("div", { class: "main" }, `${top.name} ${fmtOdds(top.odds)}`),
      el("div", { style: "margin-top:2px" }, `at ${top.book} · edge `, el("b", { class: "pos" }, pct(top.ev)), info("edge"), ` · bet ${money(stake)}`, info("kelly"), ` to win ${money(toWin(top.odds, stake))}`),
      fair,
      el("button", { class: "btn small full", onclick: () => logBet(top.name, top.book, top.odds, stake, undefined, game.sport) }, "Log this bet"));
  }

  return el("div", { class: "verdict pass" },
    el("span", { class: "tag", style: "background:var(--bad);color:#fff" }, "PASS"),
    el("div", { class: "main" }, "No edge here"),
    el("div", { style: "margin-top:2px" }, `Best price: ${top.name} ${fmtOdds(top.odds)} at ${top.book} (${pct(top.ev)}). The book is charging more than the bet is worth.`),
    fair);
};

const whenChip = (iso, now) => {
  const t = new Date(iso).getTime();
  if (t <= now && now - t < 4 * 3600e3) return el("span", { class: "when live" }, "● LIVE");
  if (t <= now) return el("span", { class: "when" }, "Started");
  const d = new Date(iso);
  const hrs = (t - now) / 3600e3;
  const label = hrs < 1 ? `Starts in ${Math.max(1, Math.round(hrs * 60))} min`
    : d.toDateString() === new Date(now).toDateString() ? `Today ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
    : d.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
  return el("span", { class: "when" }, label);
};

// Remembers which "Odds" panels you opened or closed, so a re-render doesn't flip them
const oddsOpen = {};

const renderGames = () => {
  const wrap = $("#games");
  wrap.replaceChildren();

  if (!state.games.length) {
    wrap.append(emptyState("🏟️", getKey() ? "Tap ⚡ Get live odds to load this week's games." : "Add your free API key in ⚙️ and tap ⚡ Get live odds, or try the sample games.", getKey() ? null : "Try sample games", getKey() ? null : () => openSheet("sheet-game")));
    renderParlay();
    return;
  }

  const now = Date.now();
  const sorted = [...state.games].sort((x, y) => (x.commence || "9") < (y.commence || "9") ? -1 : 1);
  sorted.forEach((game) => {
    const a = analyze(game);
    const table = el("table", { class: "books" },
      el("tr", {}, el("th", {}, "Book"), el("th", {}, game.a), el("th", {}, game.b), el("th", {})));

    game.books.forEach((row) => {
      const oddsInput = (key) => el("input", {
        type: "number", inputmode: "numeric", value: row[key] ?? "", placeholder: "-110",
        className: a && ((key === "oa" && row === a.bestA) || (key === "ob" && row === a.bestB)) ? "best" : "",
        onchange: (e) => { row[key] = e.target.value === "" ? null : Number(e.target.value); commit(); },
      });
      table.append(el("tr", {},
        el("td", {}, el("input", { value: row.book, placeholder: "Book", onchange: (e) => { row.book = e.target.value; commit(); } })),
        el("td", {}, oddsInput("oa")),
        el("td", {}, oddsInput("ob")),
        el("td", {}, el("button", { class: "btn ghost small", onclick: () => { game.books = game.books.filter((r) => r !== row); commit(); } }, "✕"))));
    });

    const filled = a ? a.rows.length : 0;
    wrap.append(el("div", { class: "card" },
      el("div", { class: "head" },
        el("div", { class: "matchup" },
          badge(teamFor(game.a, game.sport), true, "A"), el("span", { class: "vs" }, "VS"), badge(teamFor(game.b, game.sport), true, "B"),
          el("div", { style: "margin-left:4px;min-width:0" }, el("h3", {}, game.apiId ? game.name : `${game.a} vs ${game.b}`),
            game.sample ? el("div", { class: "muted" }, "Sample, made-up odds") : null,
            game.commence ? el("div", { style: "margin-top:4px" }, whenChip(game.commence, now)) : null)),
        el("button", { class: "btn ghost small", onclick: () => { state.games = state.games.filter((g) => g !== game); commit(); toast("Game removed"); } }, "🗑")),
      renderVerdict(game, a),
      el("details", { class: "odds", open: oddsOpen[game.id] ?? filled < 2, ontoggle: (e) => { oddsOpen[game.id] = e.currentTarget.open; } },
        el("summary", {}, `Odds (${filled} book${filled === 1 ? "" : "s"})`),
        table,
        el("button", { class: "btn ghost small full", onclick: () => { game.books.push({ book: "", oa: null, ob: null }); commit(); } }, "+ Add sportsbook"))));
  });
  renderParlay();
};

// ================= LIVE ODDS =================
const KEY_LS = "edgebook-apikey";
const getKey = () => { try { return localStorage.getItem(KEY_LS) || ""; } catch (e) { return ""; } };
const setKey = (k) => { try { k ? localStorage.setItem(KEY_LS, k) : localStorage.removeItem(KEY_LS); } catch (e) { /* ignore */ } };

const renderLiveMeta = () => {
  $("#live-updated").textContent = !getKey() ? "Live odds: add your free API key in ⚙️"
    : state.lastPull ? `Updated ${new Date(state.lastPull).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}` : "Ready. Tap ⚡ to load games";
  $("#live-credits").textContent = state.creditsLeft != null ? `${state.creditsLeft} credits left` : "";
};

const pullOdds = async () => {
  const key = getKey();
  if (!key) { toast("Add your API key in ⚙️ first"); openSheet("sheet-settings"); return; }
  const sport = $("#live-sport").value;
  const btn = $("#pull-odds");
  btn.disabled = true;
  btn.textContent = "Loading…";
  $("#games").replaceChildren(el("div", { class: "skel" }), el("div", { class: "skel" }));

  const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?regions=us&markets=h2h&oddsFormat=american&apiKey=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url);
    const left = res.headers.get("x-requests-remaining");
    if (left !== null) state.creditsLeft = Number(left);
    if (res.status === 401) throw new Error("That API key didn't work. Check it in ⚙️.");
    if (res.status === 429) throw new Error("Out of credits for this month, or too many requests. Try again later.");
    if (!res.ok) throw new Error(`The odds service answered with an error (${res.status}).`);
    const events = await res.json();

    let added = 0;
    events.forEach((ev) => {
      const books = (ev.bookmakers || []).map((bk) => {
        const m = (bk.markets || []).find((x) => x.key === "h2h");
        if (!m) return null;
        const away = m.outcomes.find((o) => o.name === ev.away_team);
        const home = m.outcomes.find((o) => o.name === ev.home_team);
        return away && home ? { book: bk.title, oa: Math.round(away.price), ob: Math.round(home.price) } : null;
      }).filter(Boolean);
      if (!books.length) return;
      const existing = state.games.find((g) => g.apiId === ev.id);
      if (existing) { existing.books = books; existing.commence = ev.commence_time; }
      else {
        state.games.push({ id: uid(), apiId: ev.id, sport, name: `${ev.away_team} @ ${ev.home_team}`, a: `${ev.away_team} ML`, b: `${ev.home_team} ML`, commence: ev.commence_time, books });
        added++;
      }
    });
    // clear out sample games and games that ended more than a day ago
    const cutoff = Date.now() - 24 * 3600e3;
    state.games = state.games.filter((g) => !g.sample && (!g.commence || new Date(g.commence).getTime() > cutoff));
    state.lastPull = new Date().toISOString();
    commit();
    const edges = allLegs().filter((l) => l.ev > 0.005).length;
    toast(events.length ? `⚡ ${events.length} games loaded${added ? ` (${added} new)` : ""} · ${edges} edge${edges === 1 ? "" : "s"} found` : "No upcoming games with odds right now");
  } catch (err) {
    renderGames();
    const blocked = err instanceof TypeError;
    toast(blocked ? "Couldn't reach the odds service. Check your internet connection and try again. Some previews block outside data, so open the app from its own address." : err.message, 5000);
  } finally {
    btn.disabled = false;
    btn.textContent = "⚡ Get live odds";
    renderLiveMeta();
  }
};
$("#pull-odds").addEventListener("click", pullOdds);

// ================= PARLAY =================
const copyText = async (text, btn) => {
  try {
    await navigator.clipboard.writeText(text);
    toast("📋 Parlay copied");
  } catch (e) {
    btn.textContent = "Copy blocked: select the text above";
    setTimeout(() => { btn.textContent = "📋 Copy parlay"; }, 2500);
  }
};

const renderParlay = () => {
  const wrap = $("#parlay");
  wrap.replaceChildren();
  const legs = allLegs();
  if (new Set(legs.map((l) => l.gameId)).size < 2) return;

  Object.keys(state.parlay).forEach((k) => { if (!legs.some((l) => l.key === k)) delete state.parlay[k]; });
  const picked = legs.filter((l) => state.parlay[l.key]);

  const toggle = (leg) => {
    if (state.parlay[leg.key]) delete state.parlay[leg.key];
    else {
      legs.filter((l) => l.gameId === leg.gameId).forEach((l) => delete state.parlay[l.key]);
      state.parlay[leg.key] = true;
    }
    save();
    renderParlay();
  };

  const autoBuild = () => {
    state.parlay = {};
    const byGame = {};
    legs.forEach((l) => { if (!byGame[l.gameId] || l.ev > byGame[l.gameId].ev) byGame[l.gameId] = l; });
    const good = Object.values(byGame).filter((l) => l.ev > 0).sort((x, y) => y.ev - x.ev).slice(0, 4);
    good.forEach((l) => { state.parlay[l.key] = true; });
    save();
    renderParlay();
    toast(good.length >= 2 ? `🎲 Built a ${good.length}-leg parlay` : "Not enough +EV legs for a smart parlay");
  };

  const list = el("ul", { class: "list" });
  legs.forEach((leg) => {
    const on = !!state.parlay[leg.key];
    list.append(el("li", { class: `tap${on ? " on" : ""}`, onclick: () => toggle(leg) },
      el("div", { class: "li-top" },
        el("div", { class: "who" }, badge(teamFor(leg.side, leg.sport), false, on ? "✓" : "+"),
          el("div", { style: "min-width:0" }, el("strong", {}, leg.side), el("div", { class: "muted" }, `${leg.book} ${fmtOdds(leg.odds)}`))),
        el("span", { class: `edge ${leg.ev > 0 ? "pos" : "neg"}` }, `${on ? "✓ " : ""}${pct(leg.ev)}`))));
  });

  const card = el("div", { class: "card", id: "parlay-card" },
    el("div", { class: "head" }, el("h2", {}, "🎲 Parlay builder"),
      el("button", { class: "btn small", onclick: autoBuild }, "Auto-build")),
    el("p", { class: "muted", style: "margin:6px 0 0" }, "Tap legs to add them, one side per game. Auto-build uses only sides with an edge."),
    list);

  if (picked.length >= 2) {
    const dec = picked.reduce((m, l) => m * l.dec, 1);
    const prob = picked.reduce((m, l) => m * l.prob, 1);
    const ev = prob * dec - 1;
    const odds = toAmerican(dec);
    const stake = Math.min(kellyStake(prob, dec), state.bankroll * 0.01);
    const books = [...new Set(picked.map((l) => l.book))];
    const sports = [...new Set(picked.map((l) => l.sport))];
    const text = [`PARLAY (${picked.length} legs) ${fmtOdds(odds)}`, ...picked.map((l, i) => `${i + 1}. ${l.side} ${fmtOdds(l.odds)}`), `Book: ${books.join(", ")}`, `Stake: ${money(stake)} to win ${money(stake * (dec - 1))}`].join("\n");

    card.append(el("div", { class: `verdict ${ev > 0 ? "go" : "pass"}` },
      el("span", { class: "tag", style: `background:${ev > 0 ? "var(--good)" : "var(--bad)"};${ev > 0 ? "" : "color:#fff"}` }, ev > 0 ? "+EV PARLAY" : "NEGATIVE EV"),
      el("div", { class: "main", style: "font-size:22px" }, `${picked.length} legs · ${fmtOdds(odds)}`),
      el("div", { style: "margin-top:2px" }, `Hits about ${(prob * 100).toFixed(1)}% · edge `, el("b", { class: ev > 0 ? "pos" : "neg" }, pct(ev)), ` · bet ${money(stake)} → ${money(stake * (dec - 1))}`),
      books.length > 1 ? el("div", { style: "color:var(--warn);margin-top:6px" }, `Legs come from ${books.join(", ")}, but a parlay has to be placed at one book. Set one book in ⚙️.`) : null,
      ev <= 0 ? el("div", { class: "muted", style: "margin-top:6px" }, "At least one leg has no edge. Swap it out or skip this parlay.") : null,
      el("textarea", { readOnly: true, value: text, rows: picked.length + 3, style: "margin-top:10px;font-size:13px" }),
      el("button", { class: "btn full", onclick: (e) => copyText(text, e.currentTarget) }, "📋 Copy parlay"),
      el("button", { class: "btn ghost small full", onclick: () => logBet(`Parlay: ${picked.map((l) => l.side).join(" + ")}`, books.join("/"), odds, stake, "Parlay", sports.length === 1 ? sports[0] : "mixed") }, "Log parlay in Tracker"),
      el("div", { class: "muted", style: "margin-top:8px" }, "Most parlays lose even when every leg has an edge, so the stake is capped at 1% of your bankroll.")));
  } else {
    card.append(el("div", { class: "muted", style: "text-align:center;margin-top:8px" }, "Pick at least 2 legs."));
  }
  wrap.append(card);
};

// ================= TRACKER =================
let betFilter = "all";

const renderTracker = () => {
  const s = getStats();
  const stat = (label, value, cls = "") => el("div", { class: "stat" }, el("div", { class: "muted" }, label), el("div", { class: `v ${cls}` }, value));
  $("#stats").replaceChildren(
    stat("Net profit", money(s.profit), s.profit > 0 ? "pos" : s.profit < 0 ? "neg" : ""),
    stat("ROI", s.roi === null ? "—" : pct(s.roi), s.roi > 0 ? "pos" : s.roi < 0 ? "neg" : ""),
    stat("Record", `${s.wins}-${s.losses}-${s.pushes}`),
    stat("On pending bets", money(s.exposure)));

  // profit by bet type
  const settled = state.bets.filter((b) => b.result !== "pending");
  const rows = BET_TYPES.map((type) => {
    const group = settled.filter((b) => betType(b) === type);
    const profit = group.reduce((sum, b) => sum + betProfit(b), 0);
    const risked = group.filter((b) => b.result !== "push").reduce((sum, b) => sum + b.stake, 0);
    return { type, n: group.length, profit, roi: risked ? profit / risked : 0, wins: group.filter((b) => b.result === "won").length, losses: group.filter((b) => b.result === "lost").length };
  }).filter((r) => r.n);
  const chart = $("#type-chart");
  chart.replaceChildren();
  if (!rows.length) {
    chart.append(el("p", { class: "muted", style: "margin:6px 0 0" }, "Settle some bets and you'll see which bet types make you money and which ones lose it."));
  } else {
    const maxAbs = Math.max(...rows.map((r) => Math.abs(r.profit)), 1);
    rows.sort((x, y) => y.profit - x.profit).forEach((r) => {
      const w = (Math.abs(r.profit) / maxAbs) * 50;
      chart.append(el("div", { class: "trow" },
        el("div", { class: "tl" },
          el("span", {}, el("b", {}, r.type), el("span", { class: "muted" }, `  ${r.wins}-${r.losses} · ROI ${pct(r.roi)}`)),
          el("b", { class: r.profit > 0 ? "pos" : r.profit < 0 ? "neg" : "" }, money(r.profit))),
        el("div", { class: "tbar" }, el("div", { class: "mid" }),
          el("div", { class: "fill", style: `width:${w}%;${r.profit >= 0 ? "left:50%" : `left:${50 - w}%`};background:${r.profit >= 0 ? "var(--good)" : "var(--bad)"}` }))));
    });
    const best = rows[0];
    const worst = rows[rows.length - 1];
    if (rows.length > 1 && worst.profit < 0) chart.append(el("p", { class: "muted", style: "margin:12px 0 0" }, `💡 ${best.type} is your best bet type so far, and ${worst.type} is costing you ${money(-worst.profit)}.`));
  }

  // CLV summary
  if (s.clvs.length) {
    const avg = s.clvs.reduce((a, b) => a + b, 0) / s.clvs.length;
    const beat = s.clvs.filter((c) => c > 0).length;
    $("#clv-avg").textContent = pct(avg);
    $("#clv-avg").className = `clv ${avg > 0 ? "pos" : avg < 0 ? "neg" : ""}`;
    $("#clv-text").textContent = `You beat the closing line on ${beat} of ${s.clvs.length} bets. ${avg > 0 ? "Positive CLV means you're getting better prices than the market ends up at, which is the best early sign of a real edge." : "Negative CLV means the price usually gets better after you bet. Try betting earlier in the week, or waiting for better numbers."} ${s.clvs.length < 30 ? "You'll need about 30+ bets before you can trust this number." : ""}`;
  } else {
    $("#clv-avg").textContent = "—";
    $("#clv-avg").className = "clv";
  }

  const filters = [["all", "All"], ["pending", "Pending"], ["won", "Won"], ["lost", "Lost"]];
  $("#bet-chips").replaceChildren(...filters.map(([key, label]) =>
    el("button", { class: betFilter === key ? "on" : "", onclick: () => { betFilter = key; renderTracker(); } },
      `${label} ${key === "all" ? state.bets.length : state.bets.filter((b) => b.result === key).length}`)));

  const shown = state.bets.filter((b) => betFilter === "all" || b.result === betFilter);
  const list = $("#bet-list");
  list.replaceChildren();
  if (!shown.length) {
    list.append(el("li", { class: "empty-li" }, emptyState("📒", "No bets here yet.", "Log a bet", () => openSheet("sheet-bet"))));
    return;
  }
  shown.forEach((bet) => list.append(betRow(bet)));
};

// ================= START / SIT =================
const renderLineup = () => {
  $("#slots-val").textContent = state.slots;
  const wrap = $("#lineup");
  wrap.replaceChildren();
  if (!state.players.length) {
    wrap.append(emptyState("🏈", "Add your players with this week's projections. The best ones get START.", "Add a player", () => openSheet("sheet-player")));
    return;
  }

  const order = ["QB", "RB", "WR", "TE", "K", "DEF"];
  order.filter((pos) => state.players.some((p) => p.pos === pos)).forEach((pos) => {
    const group = state.players.filter((p) => p.pos === pos).sort((a, b) => b.proj - a.proj);
    const list = el("ul", { class: "list" });
    group.forEach((player, index) => {
      const start = index < state.slots;
      list.append(el("li", { style: start ? "" : "opacity:.7" },
        el("div", { class: "li-top" },
          el("div", { class: "who" }, badge(findTeam(player.team || ""), false, pos),
            el("div", { style: "min-width:0" }, el("strong", {}, player.name), el("span", { class: `pill ${start ? "start" : "sit"}` }, start ? "Start" : "Sit"))),
          el("div", { style: "display:flex;gap:8px;align-items:center" },
            el("span", { class: "edge" }, `${player.proj} pts`),
            el("button", { class: "btn ghost small", onclick: () => { state.players = state.players.filter((p) => p !== player); commit(); } }, "✕")))));
    });
    wrap.append(el("div", { class: "card" }, el("h3", {}, pos), list));
  });
};

// ================= forms =================
$("#add-game").addEventListener("click", () => {
  const sideA = $("#g-a").value.trim();
  const sideB = $("#g-b").value.trim();
  if (!sideA || !sideB) { toast("Enter both sides"); return; }
  const blank = (book) => ({ book, oa: null, ob: null });
  state.games.unshift({ id: uid(), name: `${sideA} vs ${sideB}`, a: sideA, b: sideB, books: ["DraftKings", "FanDuel", "BetMGM", "Caesars"].map(blank) });
  $("#g-a").value = "";
  $("#g-b").value = "";
  closeSheets();
  commit();
  go("finder");
  toast("🏟️ Game added. Now type the odds");
});

$("#sample-game").addEventListener("click", () => {
  const books = (rows) => rows.map(([book, oa, ob]) => ({ book, oa, ob }));
  state.games.unshift(
    { id: uid(), sample: true, name: "Chiefs vs Bills", a: "Chiefs ML", b: "Bills ML",
      books: books([["DraftKings", -150, 145], ["FanDuel", -150, 125], ["BetMGM", -155, 135], ["Caesars", -150, 130]]) },
    { id: uid(), sample: true, name: "Seahawks vs Rams", a: "Seahawks ML", b: "Rams ML",
      books: books([["DraftKings", 100, -120], ["FanDuel", -120, 100], ["BetMGM", -125, 105], ["Caesars", -120, 100]]) },
    { id: uid(), sample: true, name: "Packers vs Lions", a: "Packers ML", b: "Lions ML",
      books: books([["DraftKings", -115, -105], ["FanDuel", -110, -110], ["BetMGM", -110, -110], ["Caesars", -110, -110]]) },
  );
  closeSheets();
  commit();
  go("finder");
  toast("Loaded 3 sample games");
});

const updatePreview = () => {
  const odds = Number($("#b-odds").value);
  const stake = Number($("#b-stake").value);
  $("#b-preview").replaceChildren(isOdds(odds) && stake > 0
    ? el("span", {}, `Win `, el("b", { class: "pos" }, money(toWin(odds, stake))), ` · get back ${money(stake + toWin(odds, stake))}`)
    : el("span", { class: "muted" }, "Enter odds and a stake to see what you'd win."));
};
$("#b-odds").addEventListener("input", updatePreview);
$("#b-stake").addEventListener("input", updatePreview);

$("#add-bet").addEventListener("click", () => {
  const pick = $("#b-pick").value.trim();
  const odds = Number($("#b-odds").value);
  const stake = Number($("#b-stake").value);
  if (!pick || !isOdds(odds) || !(stake > 0)) { toast("Add a pick, odds (like -110) and a stake"); return; }
  ["#b-pick", "#b-odds", "#b-stake"].forEach((s) => { $(s).value = ""; });
  updatePreview();
  closeSheets();
  logBet(pick, $("#b-book").value.trim() || "DraftKings", odds, stake, $("#b-type").value);
});

$("#add-player").addEventListener("click", () => {
  const name = $("#p-name").value.trim();
  const proj = Number($("#p-proj").value);
  if (!name || $("#p-proj").value === "") { toast("Add a name and projection"); return; }
  state.players.push({ id: uid(), name, pos: $("#p-pos").value, proj, team: $("#p-team").value.trim() });
  ["#p-name", "#p-proj", "#p-team"].forEach((s) => { $(s).value = ""; });
  commit();
  toast(`🏈 ${name} added`);
});

$("#slots-minus").addEventListener("click", () => { state.slots = Math.max(1, state.slots - 1); commit(); });
$("#slots-plus").addEventListener("click", () => { state.slots = Math.min(5, state.slots + 1); commit(); });

// ================= settings =================
const fillSettings = () => {
  $("#bankroll").value = state.bankroll;
  $("#weekly").value = state.weeklyLimit;
  $("#kelly").value = String(state.kelly);
  $("#mybooks").value = state.myBooks || "";
  $("#apikey").value = getKey();
  $("#backup").value = "";
};
$("#bankroll").addEventListener("change", (e) => { state.bankroll = Math.max(0, Number(e.target.value) || 0); state.bankrollSet = true; commit(); });
$("#apikey").addEventListener("change", (e) => { setKey(e.target.value.trim()); renderLiveMeta(); renderWelcome(); toast(e.target.value.trim() ? "🔑 Key saved. Tap ⚡ in Bet Finder" : "Key removed"); });
$("#weekly").addEventListener("change", (e) => { state.weeklyLimit = Math.max(0, Number(e.target.value) || 0); commit(); });
$("#kelly").addEventListener("change", (e) => { state.kelly = Number(e.target.value); commit(); });
$("#mybooks").addEventListener("change", (e) => { state.myBooks = e.target.value.trim(); state.parlay = {}; commit(); });

$("#copy-backup").addEventListener("click", async () => {
  const text = JSON.stringify(state);
  $("#backup").value = text;
  try { await navigator.clipboard.writeText(text); toast("📋 Backup copied"); }
  catch (e) { toast("Select the text in the box and copy it"); }
});
$("#restore-backup").addEventListener("click", () => {
  try {
    const data = JSON.parse($("#backup").value);
    if (!data || !Array.isArray(data.bets)) throw new Error("bad");
    state = { ...freshState(), ...data };
    commit();
    closeSheets();
    toast("✅ Backup restored");
  } catch (e) { toast("That doesn't look like an EdgeBook backup"); }
});
let resetArmed = false;
$("#reset-all").addEventListener("click", (e) => {
  const btn = e.currentTarget;
  if (!resetArmed) { resetArmed = true; btn.textContent = "Tap again to erase everything"; setTimeout(() => { resetArmed = false; btn.textContent = "Erase everything"; }, 3000); return; }
  state = freshState();
  resetArmed = false;
  btn.textContent = "Erase everything";
  commit();
  closeSheets();
  toast("Everything erased");
});

// ================= PROPS =================
let lineupMode = "startsit";
document.querySelectorAll("#lineup-seg button").forEach((btn) => btn.addEventListener("click", () => {
  lineupMode = btn.dataset.mode;
  document.querySelectorAll("#lineup-seg button").forEach((b) => b.classList.toggle("on", b === btn));
  $("#panel-props").style.display = lineupMode === "props" ? "" : "none";
  $("#panel-startsit").style.display = lineupMode === "startsit" ? "" : "none";
}));

const STAT = {
  rec: { label: "rec yds", cv: 0.55 }, rush: { label: "rush yds", cv: 0.5 }, pass: { label: "pass yds", cv: 0.25 },
  recs: { label: "catches", cv: 0.4 }, fpts: { label: "fantasy pts", cv: 0.45 }, other: { label: "", cv: 0.4 },
};

const checkProp = () => {
  const line = Number($("#pr-line").value);
  const proj = Number($("#pr-proj").value);
  if ($("#pr-line").value === "" || $("#pr-proj").value === "" || proj <= 0) return null;
  const stat = STAT[$("#pr-stat").value];
  const sd = Math.max(proj * stat.cv, 0.8);
  const pOver = 1 - normCdf((line - proj) / sd);
  const more = pOver >= 0.5;
  const prob = more ? pOver : 1 - pOver;
  const oddsRaw = Number(more ? $("#pr-over").value : $("#pr-under").value);
  const odds = isOdds(oddsRaw) ? oddsRaw : null;
  return { name: $("#pr-name").value.trim() || "Player", statKey: $("#pr-stat").value, statLabel: stat.label, line, proj, pOver, more, prob, odds, ev: odds ? prob * toDecimal(odds) - 1 : null };
};

const renderPropOut = () => {
  const out = $("#pr-out");
  const r = checkProp();
  if (!r) { out.replaceChildren(el("div", { class: "place", style: "margin-top:12px" }, el("span", { class: "muted" }, "Enter a line and your projection."))); return; }

  const grade = r.prob >= 0.6 ? ["🔥 Strong", "var(--good)"] : r.prob >= 0.55 ? ["👍 Playable", "var(--warn)"] : ["😐 Too close", "var(--muted)"];
  const pickText = `${r.name} ${r.more ? "More" : "Less"} ${r.line} ${r.statLabel}`.trim();

  out.replaceChildren(el("div", { class: `verdict ${r.prob >= 0.55 ? "go" : "pass"}` },
    el("span", { class: "tag", style: `background:${grade[1]}` }, grade[0]),
    el("div", { class: "head" },
      el("div", { class: "main", style: "font-size:22px" }, `${r.more ? "⬆️ MORE" : "⬇️ LESS"} ${r.line}`),
      el("div", { style: "text-align:right" }, el("div", { class: "prob-big" }, `${Math.round(r.prob * 100)}%`), el("div", { class: "muted" }, "chance"))),
    el("div", { class: "meter" }, el("div", { class: "dot", style: `left:${Math.min(97, Math.max(3, r.pOver * 100))}%` })),
    el("div", { class: "head muted", style: "font-size:12px" }, el("span", {}, "Less"), el("span", {}, "More")),
    el("div", { style: "margin-top:8px" }, `You project ${r.proj} vs a line of ${r.line} (${r.proj - r.line >= 0 ? "+" : ""}${(r.proj - r.line).toFixed(1)}).`),
    r.odds !== null
      ? el("div", { style: "margin-top:4px" }, `At ${fmtOdds(r.odds)}: edge `, el("b", { class: r.ev > 0 ? "pos" : "neg" }, pct(r.ev)), r.ev > 0 ? ` · bet ${money(kellyStake(r.prob, toDecimal(r.odds)))}` : " · not worth it at this price")
      : el("div", { class: "muted", style: "margin-top:4px" }, "Pick'em apps: a leg is usually worth playing at about 55–58%+, depending on the app's payouts."),
    el("div", { class: "muted", style: "margin-top:6px;font-size:12px" }, "This is an estimate based on how much this stat usually swings. Your projection matters most."),
    el("button", { class: "btn small full", onclick: () => {
      state.props.unshift({ id: uid(), pick: pickText, prob: r.prob, odds: r.odds, ev: r.ev, date: new Date().toISOString() });
      commit();
      toast("📊 Prop saved");
    } }, "Save prop")));
};
["#pr-name", "#pr-line", "#pr-proj", "#pr-over", "#pr-under"].forEach((id) => $(id).addEventListener("input", renderPropOut));
$("#pr-stat").addEventListener("change", renderPropOut);
$("#pr-from").addEventListener("change", (e) => {
  const player = state.players.find((p) => p.id === e.target.value);
  if (!player) return;
  $("#pr-name").value = player.name;
  $("#pr-proj").value = player.proj;
  $("#pr-stat").value = "fpts";
  renderPropOut();
});

const renderProps = () => {
  const sel = $("#pr-from");
  const current = sel.value;
  sel.replaceChildren(el("option", { value: "" }, state.players.length ? "Choose a player…" : "Add players in Start/Sit first"),
    ...state.players.map((p) => el("option", { value: p.id }, `${p.name} (${p.pos}, ${p.proj} pts)`)));
  sel.value = current;

  const wrap = $("#props-list");
  wrap.replaceChildren();
  if (!state.props.length) {
    wrap.append(emptyState("📊", "Check a prop above and save the good ones here. They're handy for building a pick'em entry."));
    return;
  }
  const list = el("ul", { class: "list", style: "margin-top:0" });
  state.props.forEach((prop) => {
    list.append(el("li", {},
      el("div", { class: "li-top" },
        el("div", { class: "who" }, badge(null, false, prop.pick.includes("More") ? "⬆️" : "⬇️"),
          el("div", { style: "min-width:0" }, el("strong", {}, prop.pick),
            el("div", { class: "muted" }, prop.odds ? `${fmtOdds(prop.odds)} · edge ${pct(prop.ev)}` : "pick'em"))),
        el("span", { class: `edge ${prop.prob >= 0.55 ? "pos" : ""}` }, `${Math.round(prop.prob * 100)}%`)),
      el("div", { class: "li-actions" },
        el("button", { class: "btn small", onclick: () => {
          const odds = prop.odds || -110;
          logBet(prop.pick, prop.odds ? "DraftKings" : "Pick'em app", odds, prop.odds && prop.ev > 0 ? kellyStake(prop.prob, toDecimal(odds)) : Math.max(1, state.bankroll * 0.01), "Prop");
        } }, "Log as bet"),
        el("button", { class: "btn small ghost", onclick: () => { state.props = state.props.filter((p) => p !== prop); commit(); } }, "Delete"))));
  });
  wrap.append(list);
};

// ================= how-to extras =================
const renderConverter = () => {
  const odds = Number($("#conv-odds").value);
  const stake = Number($("#conv-stake").value) || 10;
  const out = $("#conv-out");
  if (!isOdds(odds)) { out.replaceChildren(el("span", { class: "muted" }, "Enter odds like -110 or +145.")); return; }
  const win = toWin(odds, stake);
  out.replaceChildren(
    el("div", {}, `Bet ${money(stake)} → win `, el("b", { class: "pos" }, money(win)), ` → get back ${money(stake + win)}`),
    el("div", { class: "muted", style: "margin-top:4px" }, `The book thinks this happens about ${(100 / toDecimal(odds)).toFixed(1)}% of the time (including its fee).`));
};
$("#conv-odds").addEventListener("input", renderConverter);
$("#conv-stake").addEventListener("input", renderConverter);

TEAMS.forEach((t) => {
  $("#team-grid").append(el("div", {}, badge(t, true), t.nick));
  $("#team-names").append(el("option", { value: `${t.nick} ML` }));
});

// ================= boot =================
const refresh = () => {
  if (!state.parlay) state.parlay = {};
  if (!Array.isArray(state.props)) state.props = [];
  renderWelcome();
  renderHome();
  renderGames();
  renderTracker();
  renderLineup();
  renderProps();
  renderLiveMeta();
};

showView();
renderPropOut();
refresh();

// account sync when running as a Claude artifact (CodePen just uses this device)
(async () => {
  if (!window.claude || typeof window.claude.use !== "function") return;
  try {
    const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
    if (!db || !user) return;
    const id = await user.id();
    if (!id) return;
    const doc = db.doc(`data/users/${id}/state`);
    const snap = await doc.get();
    if (snap.exists) {
      state = { ...freshState(), ...structuredClone(snap.data()) };
      try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
      refresh();
    } else {
      await doc.set(JSON.parse(JSON.stringify(state)));
    }
    stateDoc = doc;
    setSync("Synced to your account");
  } catch (e) {
    setSync("Saved on this device only");
  }
})();
