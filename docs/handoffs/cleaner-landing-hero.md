# Cleaner Landing Hero Handoff

## Status

Cleaned up the landing hero after browser feedback. The messy inline chart SVG background was removed. Desktop now uses the existing Evidence Bench product screenshot as a subdued proof asset; tablet and mobile use a calm dark surface with no background UI behind the headline or CTAs.

## Next

Push, open the PR, merge when Vercel is clean, then verify `https://chartreviewlab.company/` at desktop, tablet, and mobile widths.

## Risks

- The product screenshot is intentionally desktop-only so the comment-sized and mobile viewports stay clean.
- Keep future hero visuals product-grounded but avoid placing chart labels or UI chrome directly behind the text.

## Files

- `docs/handoffs/cleaner-landing-hero.md`
- `index.html`
- `styles.css`

## Checks

- Browser QA at `1440x1000`, `882x946`, and `390x900`
- Screenshot review for the same three widths
- Verified no `.chart-scene` inline SVG remains in the landing hero
- Verified no horizontal overflow or console errors
