# Life OS

Daily, weekly, monthly, quarterly and yearly cages for BevChain HR work in Brisbane. Chrona routes the day; the other apps hold the numbers.

Live page: https://timesnapx.github.io/life-os/

Checklists stay in **this browser** (`localStorage` key `life-os-v1`). Nothing is uploaded to GitHub. Reset clears ticks and notes only — not Pay Ledger, GreenLedger, or PulseBoard.

Do not copy financial balances into this app. Log income in [Pay Ledger](https://timesnapx.github.io/pay-ledger/). Plan debt in [GreenLedger](https://timesnapx.github.io/green-ledger/).

Source of truth for copy and rules: [`LIFE_OS.md`](LIFE_OS.md).

## Screens

- **Today** — clock-aware daily cage (4:00 up through 9:00–9:30 bed), short money/admin list, body, optional career toggle. Wednesday payday badge and ritual when today is Wednesday.
- **Week** — Mon–Sat strip, Sunday deep-work plan, midweek career pocket, Saturday OT bed rule, Wednesday payday ritual.
- **Month** — first-free-Sunday review + Wednesday payday trail.
- **Quarter** — debt, career, body, money, life-ops scoreboard cards (no invented balances).
- **Year** — Sept → Sept page: income, debt delta, licence, health, Kenworth aim, Pulse reset, next year's big ticket.

## Run locally

```powershell
.\start.ps1
```

Or:

```bash
python -m http.server 4177 --bind 127.0.0.1
```

Then open http://127.0.0.1:4177

## App key

- [Pay Ledger](https://timesnapx.github.io/pay-ledger/)
- [GreenLedger](https://timesnapx.github.io/green-ledger/)
- [BevChain take-home](https://timesnapx.github.io/bevchain-take-home/)
- [MC career tracker](https://timesnapx.github.io/mc-career-tracker/)
- [PulseBoard](https://timesnapx.github.io/pulseboard/)
