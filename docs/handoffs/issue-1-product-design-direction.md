# Issue 1 Handoff

## Status

Selected Product Design direction is Evidence Bench. Durable visual brief added at `docs/design/chart-review-lab-visual-brief.md`, with the selected reference mock copied to `docs/assets/chart-review-lab-evidence-bench.png`.

## Next

Open PR for review and merge. Follow-on implementation issues should reference `docs/design/chart-review-lab-visual-brief.md`.

## Risks

- Advanced Charts approval is still pending; do not imply approval in prototype copy.
- Keep all screens chart-review only: no recommendations, rankings, alerts, broker actions, orders, positions, or execution behavior.
- The generated mock is directional. Implementation must keep text readable and controls functional across desktop and mobile.

## Files

- `docs/design/chart-review-lab-visual-brief.md`
- `docs/assets/chart-review-lab-evidence-bench.png`
- `docs/handoffs/issue-1-product-design-direction.md`

## Checks

- `git diff --check`
- `curl -sS https://chartreviewlab.company/api/datafeed/status`
- Text scan for prohibited trading-language terms; matches are expected safety-boundary caveats plus existing CSS `position` properties.
- Visual reference asset opened and checked locally.
