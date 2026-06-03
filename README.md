# Chart Review Lab

Public chart-review demo with Alpaca-backed datafeed endpoints, annotation artifacts, and Advanced Charts readiness notes.

Public site:

```text
https://chartreviewlab.company
```

Routes:

- `/` public chart-review demo page
- `/widget-demo` public TradingView widget view
- `/prototype` Alpaca-backed Lightweight Charts annotation prototype
- `/advanced-charts` guarded Advanced Charts adapter scaffold while approval is pending
- `/evidence` public artifact handoff with page proof points, caveats, and validation links

Suggested form values:

- Company name: `Dylan McCavitt / Independent Developer`
- Website URL for the integration: use the deployed URL for this site.
- Link to GitHub profile: `https://github.com/DylanMcCavitt`
- Is your website live?: `Yes` after deployment succeeds.
- Company profile: choose the closest available option to analytics, fintech, or other.
- Job title: `Independent Developer`
- Do you have your own data feed?: use `Yes` after the Alpaca env vars below are configured and `/api/datafeed/status` reports `ok: true`.
- Reason:

```text
Public chart-review app with Alpaca UDF datafeed and official drawings API for levels, boxes, labels. No orders/trading.
```

This site should not include any TradingView private library code.

See `docs/advanced-charts-readiness.md` for post-approval setup steps and adapter contracts.

## Alpaca Datafeed

The public UDF base URL is:

```text
https://chartreviewlab.company/api/datafeed
```

Configure these Vercel env vars:

```text
ALPACA_API_KEY_ID
ALPACA_API_SECRET_KEY
ALPACA_DATA_FEED=sip
```

Check status:

```text
https://chartreviewlab.company/api/datafeed/status
```
