# Issue 17 Handoff

## Status

Implemented `review_artifact_v1` as the review-only JSON handoff format for Chart Review Lab. Added a small schema, browser/node validator, sample fixtures, upstream-writing docs, and aligned `/prototype` JSON export with the versioned artifact shape.

PR base should remain `feat/issue-16-artifact-viewer-contract` while PR #22 is open.

## Next

Open the PR for #17 against `feat/issue-16-artifact-viewer-contract` with `Closes #17`, run an independent PR diff review, fix real findings, and create the next issue-chain thread before final closeout.

## Risks

- Local static serving cannot hit the serverless Alpaca datafeed without Vercel env; local `/prototype` shows a datafeed error and a validation-error JSON payload until a public `datafeedBase` override is used.
- The schema is intentionally small and mirrors current prototype annotation types only. Broader artifact loading or UI import behavior belongs in later issues.
- The validator rejects boundary-expanding field names and secret-looking fields/URLs, but it is not a substitute for keeping upstream credentials server-side.

## Files

- `review-artifact.js`
- `prototype.html`
- `prototype.js`
- `docs/schemas/review_artifact_v1.schema.json`
- `docs/fixtures/review_artifact_v1_nvda_daily.json`
- `docs/fixtures/review_artifact_v1_spy_hourly.json`
- `docs/review-artifact-v1.md`
- `scripts/validate-review-artifacts.js`
- `CONTEXT.md`
- `README.md`
- `docs/handoffs/issue-17-review-artifact-schema.md`

## Checks

- `node scripts/validate-review-artifacts.js`
- `node --check review-artifact.js`
- `node --check prototype.js`
- `node --check advanced-charts-adapter.js`
- `node -e "for (const f of ['docs/schemas/review_artifact_v1.schema.json','docs/fixtures/review_artifact_v1_nvda_daily.json','docs/fixtures/review_artifact_v1_spy_hourly.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('json ok')"`
- `git diff --check`
- `if rg -n '"(score|recommendation|alert|candidate|candidateRank|candidate_rank|rank|order|position|account|execution|broker|portfolio|signal)"\s*:' docs/fixtures review-artifact.js prototype.js docs/schemas/review_artifact_v1.schema.json; then echo 'boundary field key found'; exit 1; else echo 'ok: no forbidden artifact field keys found'; fi`
- `curl -I http://localhost:4173/prototype`
- `curl -sS http://localhost:4173/prototype | rg -n 'review-artifact.js|prototype.js|Review artifact JSON'`
- Google Chrome headless dump of local `/prototype` confirmed local static datafeed error produces `review_artifact_v1_validation_error`.
- Google Chrome headless dump of `/prototype?datafeedBase=https://chartreviewlab.company/api/datafeed` produced a valid `review_artifact_v1` payload for `NASDAQ:NVDA` with 6 annotations.
