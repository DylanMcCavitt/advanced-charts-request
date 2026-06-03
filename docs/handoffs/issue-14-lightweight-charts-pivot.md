# Issue 14 Handoff

## Status

Started the pivot from Advanced Charts approval-readiness to Lightweight Charts as the primary supported path after TradingView declined Advanced Charts for personal use. Created GitHub issue #14 and branch `feat/issue-14-lightweight-charts-pivot`.

Updated the public pages and durable docs so `/prototype` is positioned as the Lightweight Charts annotation workspace, `/advanced-charts` is an archived decision page, and the evidence/reporting copy no longer presents Advanced Charts as pending.

## Next

Push the branch, open the PR, merge when checks are clean, then verify `https://chartreviewlab.company/`, `/prototype`, `/advanced-charts`, `/widget-demo`, `/evidence`, and `/api/datafeed/status` after the production deploy.

## Risks

- Local datafeed status may report missing Alpaca env vars if Vercel env is not pulled into the worktree.
- `/prototype` still uses a pinned public Lightweight Charts CDN version; update only with a separate compatibility check.
- The repo has no root `AGENTS.md`, `CONTEXT.md`, architecture doc, active plan doc, or ADR directory in this checkout; the thread prompt supplied the working flow.
- `vercel dev` prompted to set up/link this worktree, so verification used `npx --yes serve . -l 4173` for static route QA and the live production datafeed status endpoint for datafeed proof.

## Files

- `README.md`
- `index.html`
- `prototype.html`
- `widget-demo.html`
- `evidence.html`
- `advanced-charts.html`
- `advanced-charts-adapter.js`
- `docs/advanced-charts-readiness.md`
- `docs/handoffs/issue-14-lightweight-charts-pivot.md`

## Checks

- `node --check prototype.js`
- `node --check advanced-charts-adapter.js`
- Adapter smoke test mapped five sample annotation types into 6 dormant historical Advanced Charts call descriptors and reported `declined_for_personal_use`
- `git diff --check`
- `git ls-files | rg "charting_library|vendor/tradingview|datafeeds/udf"` returned no tracked private Advanced Charts asset paths
- Stale pending-approval wording scan found no active public copy presenting Advanced Charts as pending
- Product-boundary scan found only explicit negative guardrail language for advice, ranking, alerting, broker, order, account, position, and execution behavior
- `curl -I http://localhost:4173/` returned `200 OK` through `npx --yes serve . -l 4173`
- `curl -I http://localhost:4173/prototype` returned `200 OK`
- `curl -I http://localhost:4173/advanced-charts` returned `200 OK`
- `curl -I http://localhost:4173/widget-demo` returned `200 OK`
- `curl -I http://localhost:4173/evidence` returned `200 OK`
- `curl -sS https://chartreviewlab.company/api/datafeed/status` returned `ok: true`, `feed: "sip"`, latest bar `2026-06-03T04:00:00Z`
- Google Chrome headless desktop screenshot of `/` confirmed Lightweight Charts is first-viewport visible and the hero/status chips fit
- Google Chrome headless desktop screenshot of `/prototype` with live `datafeedBase` confirmed datafeed ok, live candles, local overlays, annotation evidence, and source metadata
- Google Chrome headless desktop screenshot of `/advanced-charts` confirmed the declined decision page and Lightweight Charts CTA
- Chrome DevTools mobile emulation at `390x900` confirmed `/prototype` renders datafeed ok, live candles, local overlays, and no document overflow
- Chrome DevTools mobile emulation at `390x900` confirmed `/advanced-charts` has no document overflow and clearly states Advanced Charts was declined
- Chrome DevTools desktop/mobile DOM sweep confirmed `/`, `/prototype`, `/advanced-charts`, `/widget-demo`, and `/evidence` have no document-level horizontal overflow
