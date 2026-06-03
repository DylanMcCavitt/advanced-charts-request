# Chart Review Lab

Public chart-review artifact viewer with Alpaca-backed datafeed endpoints, Lightweight Charts rendering, deterministic local annotation artifacts, and visible source caveats.

Public site:

```text
https://chartreviewlab.company
```

Routes:

- `/` public chart-review contract and demo page
- `/widget-demo` public TradingView widget comparison view
- `/prototype` Alpaca-backed Lightweight Charts artifact-review workspace
- `/advanced-charts` archived Advanced Charts decision page
- `/evidence` public evidence report with page proof points, caveats, and validation links

TradingView declined Advanced Charts for personal use. Chart Review Lab now treats the open-source Lightweight Charts path as the primary implementation and keeps `/advanced-charts` only as a decision record. This site must not include any TradingView private library code.

See `CONTEXT.md` for the product contract, repo boundary, ownership split with TradingView MCP and upstream artifact writers, and the post-pivot viewer flow.

See `docs/advanced-charts-readiness.md` for the pivot decision, Lightweight Charts route contract, and historical adapter notes.

See `docs/review-artifact-v1.md` for the review-only artifact schema, sample fixtures, validation helper, and upstream-writing contract.

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
