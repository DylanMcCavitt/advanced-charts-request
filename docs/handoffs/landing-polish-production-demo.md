# Landing Polish Handoff

## Status

Polished the public landing and demo copy so Chart Review Lab presents as a working chart-review demo instead of an access-request placeholder. The root page now leads with the live annotation demo, evidence report, and datafeed status. Prototype, widget, and evidence pages no longer foreground pending/scaffold status in their public UI.

## Next

Push the branch, open the PR, merge when Vercel is clean, then verify the production URLs for `/`, `/prototype`, `/widget-demo`, `/evidence`, and `/api/datafeed/status`.

## Risks

- Advanced Charts readiness still exists in docs and the hidden `/advanced-charts` route; keep it honest there, but avoid making it primary public demo copy.
- Public pages should continue to keep chart-review boundaries visible without presenting the product as advisory or automated.

## Files

- `README.md`
- `docs/handoffs/landing-polish-production-demo.md`
- `evidence.html`
- `index.html`
- `prototype.html`
- `styles.css`
- `widget-demo.html`

## Checks

- `node --check prototype.js`
- `node --check advanced-charts-adapter.js`
- `git diff --check`
- Public HTML text scan for `pending`, `scaffold`, `fallback`, `request`, and `approval`
- Browser QA at `1440x1000` and `390x900` for landing, prototype, widget, and evidence pages
- Visual screenshot review for updated landing desktop/mobile and prototype mobile
