# Issue 3 Handoff

## Status

Implemented `/prototype` as an Evidence Bench workspace using TradingView Lightweight Charts from the public CDN, server-side UDF history requests, and local SVG annotation overlays. The page includes fixed symbol/timeframe controls, deterministic annotation filters, clear/restore behavior, source metadata, annotation JSON, artifact actions, loading/empty/error/stale states, and mobile stacking.

## Next

Push branch, open PR, merge when checks are clean, then verify `https://chartreviewlab.company/prototype` and `/api/datafeed/status` after the production deploy.

## Risks

- Local `vercel dev` does not have Alpaca env in this worktree, so local same-origin datafeed calls show the datafeed-error state. Successful local chart QA used `?datafeedBase=https%3A%2F%2Fchartreviewlab.company%2Fapi%2Fdatafeed`, which still routes through the existing public server-side UDF endpoints.
- Advanced Charts approval is still pending. `/prototype` uses the open-source Lightweight Charts renderer and does not include private TradingView library code.
- Hourly Alpaca responses can appear stale depending on returned latest bar time; the prototype keeps stale data visible with an explicit banner.

## Files

- `prototype.html`
- `prototype.js`
- `styles.css`
- `index.html`
- `widget-demo.html`
- `docs/handoffs/issue-3-lightweight-charts-prototype.md`

## Checks

- `node --check prototype.js`
- `git diff --check`
- `curl -I http://localhost:4173/prototype` returned `200 OK` through `vercel dev --listen 4173`
- `curl -sS https://chartreviewlab.company/api/datafeed/status` returned `ok: true`, `feed: "sip"`, latest bar `2026-06-02T04:00:00Z`
- Live history check against `https://chartreviewlab.company/api/datafeed/history` for `NASDAQ:NVDA` daily returned `s: "ok"` with real bars
- Agent-browser local no-env QA confirmed clean datafeed-error state, no page errors, no console errors, and no horizontal overflow
- Agent-browser live-data QA via `datafeedBase` confirmed live NVDA daily render, six annotation rows, SVG overlay content, annotation JSON, symbol change to `NASDAQ:AMD`, timeframe change to `60`, stale-state banner, Fib filter, clear/restore, and no horizontal overflow
- Agent-browser mobile QA at `390x900` confirmed no horizontal overflow and stacked controls, chart, evidence, JSON, and caveat order
- Source scan confirmed no client-side Alpaca secret strings in `prototype.html`, `prototype.js`, `styles.css`, `index.html`, or `widget-demo.html`
- Word-boundary product-boundary scan found no prohibited recommendation, ranking, alerting, brokerage, order, position, execution, trading, portfolio, signal, candidate, or financial-advice wording in `prototype.html` or `prototype.js`
