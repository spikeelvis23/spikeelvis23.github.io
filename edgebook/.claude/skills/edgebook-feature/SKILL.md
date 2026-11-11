---
name: edgebook-feature
description: Use when adding or changing any EdgeBook feature, screen, card, button or calculation in index.html, style.css or app.js, so new code matches how the app is built.
---

# Adding a feature to EdgeBook

## How the app is built
- `index.html` holds the 5 screens (`#view-home`, `#view-finder`, `#view-tracker`, `#view-lineup`, `#view-learn`), the bottom tab bar, and the slide-up sheets (`.sheet` with `id="sheet-..."`).
- `app.js` holds everything else, in this order: helpers → teams → state/saving → navigation/sheets → math → actions → one `render...()` function per screen → form handlers → settings → boot.
- All data lives in one `state` object. Add new fields to `DEFAULTS` so old saved data still loads.

## The pattern for every change
1. Change `state` (push, edit or filter).
2. Call `commit()`. It saves and re-renders every screen. Use `save()` alone only when you re-render one part yourself.
3. Give feedback with `toast("short message")`. Use `toast(text, 5000)` for longer explanations.

## Building UI
- Build elements with `el(tag, props, ...children)`, for example `el("button", { class: "btn small", onclick: fn }, "Label")`.
- Never put user text into `innerHTML`. `el()` makes it safe.
- Use the existing classes: `card`, `btn`, `btn ghost`, `btn small`, `list`, `li-top`, `who`, `pill`, `edge`, `verdict go|pass|arb`, `tag`, `muted`, `pos`, `neg`, `empty`.
- Empty screens use `emptyState(icon, text, buttonText, onClick)`.
- Open forms with `openSheet("sheet-id")`, or with `data-open="sheet-id"` on a button. Switch screens with `go("finder")` or `data-go="finder"`.
- Team color badges: `badge(teamFor(text, sport), big, fallbackText)`. `teamFor` returns no team for non-NFL sports, because the colors are NFL only.
- Plain-English help buttons: add an entry to `TIPS`, then use `info("key")`.

## Math helpers to reuse
`toDecimal`, `toAmerican`, `toWin`, `isOdds`, `fmtOdds`, `money`, `pct`, `analyze(game)`, `kellyStake(prob, dec)`, `allLegs()`, `getStats()`, `betProfit`, `clvOf`, `normCdf`.

## Style rules
- Modern JS: `const`/`let`, arrow functions, `forEach`/`map`/`filter`, template literals.
- Mobile first: check that it looks right at 390px wide.
- Keep the honest tone: no "guaranteed" or "lock" copy.

## Before you finish
- Open the page and click through the new feature, including its empty state.
- Check the browser console for errors.
- Explain the change to Spike in plain language: what changed, and which function to look at.
