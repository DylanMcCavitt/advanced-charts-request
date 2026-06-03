# Issue 16 Handoff

## Status

Defined the post-pivot Chart Review Lab product contract and repo boundary in durable docs. `CONTEXT.md` now establishes Chart Review Lab as the public chart-review artifact viewer and evidence surface, documents the upstream artifact handoff into the viewer, and splits ownership cleanly between this repo, upstream artifact writers, and TradingView MCP.

Updated `README.md` so the public repo summary points readers to the new contract doc, and clarified in `docs/advanced-charts-readiness.md` that the readiness document remains the pivot decision record rather than the primary product-boundary spec.

## Next

Push branch `feat/issue-16-artifact-viewer-contract`, open the PR against `feat/issue-14-lightweight-charts-pivot` while PR #15 remains open, then merge or retarget to `main` if PR #15 lands first and local `main` is synced.

After merge, verify the public docs and route framing still match the contract, then continue the issue chain with the next ready issue.

## Risks

- PR #16 is intentionally stacked on PR #15 while the Lightweight Charts pivot remains open. If PR #15 merges first, retarget #16 to `main` before merge.
- The new contract defines upstream artifact inputs and viewer responsibilities, but it does not implement artifact load or export state changes in this issue.
- Public product copy must stay chart-review-only so later issues do not drift into scanning, recommendation, alerting, or execution language.

## Files

- `CONTEXT.md`
- `README.md`
- `docs/advanced-charts-readiness.md`
- `docs/handoffs/issue-16-artifact-viewer-contract.md`

## Checks

- `git diff --check`
- `git ls-files | rg "charting_library|vendor/tradingview|datafeeds/udf"` returned no tracked private TradingView asset paths
- Contract scan confirmed the docs mention Quant Scan, TradingView MCP, deterministic rendering, stable selectors/API, quiet evidence-first workspace language, and future load/export/control states
- Boundary scan found only explicit guardrail language for scanning, ranking, recommendation, alerting, broker, order, account, position, portfolio, execution, and financial-advice terms
