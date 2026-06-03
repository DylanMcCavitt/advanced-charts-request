# Issue 18 Handoff

## Status

Implemented review artifact loading in `/prototype` while keeping normal datafeed mode as the default. The workspace now accepts `?artifactUrl=` for JSON artifacts and `?artifact=` for known static fixtures, validates `review_artifact_v1`, rejects unsafe artifact URLs, fetches the artifact's public candle history route, renders loaded annotations on the existing Lightweight Charts and SVG overlay surface, and shows artifact source metadata plus inspectable JSON.

PR should target `feat/issue-17-review-artifact-schema` while PR #23 remains open.

## Next

Open the #18 PR with `Closes #18`, run an independent PR diff review, fix real findings, rerun checks, and create the next issue-chain thread from the #18 PR branch if it remains stacked.

## Risks

- Local static serving still needs `datafeedBase=https://chartreviewlab.company/api/datafeed` to fetch candles because `/api/datafeed/*` is serverless.
- Current fixtures are sample artifacts and may show stale state as time moves forward.
- Artifact JSON may reference public history routes only; credentials, secret query values, and execution/scoring-style fields remain outside the artifact boundary.

## Files

- `prototype.html`
- `prototype.js`
- `review-artifact.js`
- `styles.css`
- `docs/review-artifact-v1.md`
- `scripts/test-prototype-artifact-loading.js`
- `docs/handoffs/issue-18-load-review-artifacts.md`

## Checks

- `node scripts/validate-review-artifacts.js`
- `node scripts/test-prototype-artifact-loading.js`
- `node --check review-artifact.js`
- `node --check prototype.js`
- `node --check advanced-charts-adapter.js`
- JSON parse check for schema and fixtures
- Forbidden artifact field-key scan across fixtures, schema, validator, prototype, and loader test
- `git diff --check`
- `curl -I http://localhost:4173/prototype`
- Chrome headless DOM check for `/prototype?datafeedBase=https://chartreviewlab.company/api/datafeed`
- Chrome headless DOM check for `/prototype?artifactUrl=/docs/fixtures/review_artifact_v1_nvda_daily.json&datafeedBase=https://chartreviewlab.company/api/datafeed`
- Chrome headless DOM check for `/prototype?artifact=spy-hourly&datafeedBase=https://chartreviewlab.company/api/datafeed`
- Chrome headless screenshot checks for desktop and 390px mobile artifact views
