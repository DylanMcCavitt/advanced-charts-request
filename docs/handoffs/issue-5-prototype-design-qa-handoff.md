# Issue 5 Handoff

## Status

Implemented the prototype design QA and evidence artifact handoff pass. The new `/evidence` page is a public report-style artifact that summarizes the selected Evidence Bench direction, route proof points, datafeed/source caveats, Advanced Charts pending state, and chart-review-only boundary. Landing, prototype, widget fallback, and Advanced Charts scaffold pages now link to the evidence handoff and expose the canonical `https://chartreviewlab.company/api/datafeed` base.

## Public URLs

- `https://chartreviewlab.company/` proves the public request landing page, datafeed/artifact links, and chart-review boundary.
- `https://chartreviewlab.company/prototype` proves the Alpaca-backed Lightweight Charts annotation workspace, visible labels, selected evidence, source metadata, annotation JSON, and artifact actions.
- `https://chartreviewlab.company/widget-demo` proves the public TradingView widget fallback and its programmable-drawing limitation.
- `https://chartreviewlab.company/advanced-charts` proves the pending Advanced Charts adapter scaffold without private TradingView library assets.
- `https://chartreviewlab.company/evidence` proves the public artifact handoff with route proof points, datafeed links, caveats, and responsive QA criteria.
- `https://chartreviewlab.company/api/datafeed/status` proves the public server-side datafeed status endpoint.

## Next

Push the branch, open the PR, merge when checks are clean, then verify the public production URLs above return `200` after Vercel deploys the merge.

## Risks

- TradingView Advanced Charts access is still pending. Public copy must continue to say pending until approved files are loaded through a private path.
- Local static server QA used `.html` paths because the worktree was not linked for `vercel dev`; production clean URLs should be verified after deployment.
- The prototype local browser check used `?datafeedBase=https://chartreviewlab.company/api/datafeed` so the chart could load production Alpaca-backed data during static QA.

## Files

- `README.md`
- `advanced-charts.html`
- `docs/advanced-charts-readiness.md`
- `docs/handoffs/issue-5-prototype-design-qa-handoff.md`
- `evidence.html`
- `index.html`
- `prototype.html`
- `prototype.js`
- `styles.css`
- `widget-demo.html`

## Checks

- `node --check prototype.js`
- `node --check advanced-charts-adapter.js`
- `git diff --check`
- `git ls-files | rg "charting_library|vendor/tradingview|datafeeds/udf"` returned no tracked private TradingView asset paths
- Safety-boundary text scan found only explicit caveats and docs guardrails for recommendation, ranking, alerting, broker, order, position, portfolio, execution, candidate, and financial-advice terms
- Local static `curl -I` returned `200 OK` for `/index.html`, `/prototype.html`, `/widget-demo.html`, `/advanced-charts.html`, and `/evidence.html`
- Browser QA at `1440x1100` and `390x900` verified landing, prototype, widget, Advanced Charts scaffold, and evidence pages render key selectors without horizontal overflow or console errors
- Prototype browser QA loaded production datafeed via `datafeedBase`, rendered 6 annotation rows, showed annotation JSON, and reported `Datafeed ok`
- Visual spot checks reviewed landing mobile, prototype mobile, evidence desktop, and evidence mobile screenshots for wrapping, spacing, visible caveats, and direct artifact links
