# Issue 2 Handoff

## Status

Implemented `/widget-demo` as a public static fallback page using the TradingView public Advanced Chart widget embed for `NASDAQ:NVDA`. The page matches the Evidence Bench direction with a compact status bar, control panel, central chart stage, evidence/caveat panel, and visible TradingView attribution.

## Next

Push the branch, open PR, deploy, verify the production `/widget-demo` clean URL, then merge if checks are clean.

## Risks

- TradingView widget content is loaded from TradingView and can take a few seconds to render, especially on mobile-width captures.
- Widget mode is intentionally limited: it displays public charts but does not expose programmable native drawing APIs for Chart Review Lab annotations.
- Advanced Charts approval is still pending; the page must not imply approval is granted.

## Files

- `widget-demo.html`
- `styles.css`
- `index.html`
- `docs/handoffs/issue-2-widget-fallback-demo.md`

## Checks

- `git diff --check`
- `curl -I http://localhost:4173/widget-demo` returned `200 OK` through `vercel dev --listen 4173`
- `curl -sS https://chartreviewlab.company/api/datafeed/status` returned `ok: true`, `feed: "sip"`
- Text scan of `widget-demo.html` for prohibited trading-product terms found no matches
- Playwright screenshot check waited for `.tradingview-widget-container iframe` on desktop and mobile
- Mobile scripted check confirmed iframe width `356`, iframe height `577`, attribution text `Charts by TradingView`, and no horizontal overflow at `390px`
