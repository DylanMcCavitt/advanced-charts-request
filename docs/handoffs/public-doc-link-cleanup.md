# Public Doc Link Cleanup Handoff

## Status

Removed visible public-site links to raw Markdown docs and renamed public "handoff" copy to "evidence report" copy. Added deployment exclusion for Markdown files under `docs/` so internal handoffs, design notes, and readiness setup docs do not render as raw `<pre>` pages on the prototype site.

## Next

Push, open the PR, merge when Vercel is clean, then verify the reported raw doc URL no longer displays raw Markdown.

## Risks

- `docs/assets/` must remain deployable because the landing hero uses the Evidence Bench screenshot.
- Advanced Charts copy must still say access is pending until approved TradingView files are available.

## Files

- `.vercelignore`
- `README.md`
- `advanced-charts.html`
- `evidence.html`
- `index.html`
- `prototype.html`
- `styles.css`
- `vercel.json`
- `widget-demo.html`

## Checks

- `node --check prototype.js`
- `node --check advanced-charts-adapter.js`
- `jq . vercel.json`
- `vercel build`
- Verified `.vercel/output/static` contains no Markdown files and still includes `docs/assets/chart-review-lab-evidence-bench.png`
- Vercel dev: `/docs/advanced-charts-readiness.md`, `/docs/design/chart-review-lab-visual-brief.md`, and `/docs/handoffs/issue-5-prototype-design-qa-handoff.md` return 307 to `/evidence`
- Vercel dev: `/`, `/evidence`, `/prototype`, `/widget-demo`, and the hero screenshot asset return 200
- Browser QA at `685x946` and `390x900` for `/evidence`: no horizontal overflow, console errors, raw doc links, "handoff" text, or placeholder text
- Browser QA for `/docs/advanced-charts-readiness.md`: lands on `/evidence`, with no `<pre>` raw Markdown view
- Public HTML text scan finds no `/docs/*.md` links, "handoff" text, or visible placeholder wording
