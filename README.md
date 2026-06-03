# Chart Review Lab

Public landing page for requesting TradingView Advanced Charts access.

Public site:

```text
https://chartreviewlab.company
```

Routes:

- `/` public request page
- `/widget-demo` public TradingView widget fallback
- `/prototype` Alpaca-backed Lightweight Charts annotation prototype
- `/advanced-charts` guarded Advanced Charts adapter scaffold while approval is pending

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
