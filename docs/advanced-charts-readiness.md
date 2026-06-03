# Advanced Charts Decision and Lightweight Charts Pivot

## Status

TradingView declined Advanced Charts for personal use on June 3, 2026. Chart Review Lab now treats Lightweight Charts as the primary renderer path for the public chart-review workspace.

This repository does not include private TradingView library files, copied charting library bundles, licensed Advanced Charts assets, broker integrations, order-routing code, or account-state workflows.

Primary public routes:

- `/prototype` is the Alpaca-backed Lightweight Charts annotation workspace.
- `/widget-demo` is a display-only TradingView public widget comparison route.
- `/advanced-charts` is an archived decision page for the declined Advanced Charts request.
- `/api/datafeed` is the Alpaca-backed UDF-shaped datafeed base.
- `/evidence` is the public artifact handoff with route proof points, source caveats, and validation links.

Primary public reference:

- Lightweight Charts use cases: https://www.tradingview.com/lightweight-charts/

## Lightweight Charts Route Contract

The supported demo path is:

```text
/prototype
```

The route loads Lightweight Charts from a public CDN, reads OHLCV through Chart Review Lab's server-side datafeed endpoints, and renders local SVG review overlays above the chart.

The review workspace must keep these properties:

- Candles are rendered with Lightweight Charts.
- Alpaca Market Data credentials stay server-side.
- Source metadata and latest-bar context stay visible.
- Review overlays are deterministic artifacts for inspection only.
- Annotation JSON remains inspectable and exportable.
- The page keeps mobile stacking and non-hover evidence access.
- The page does not choose symbols, rank outcomes, alert, connect brokers, manage positions, route orders, or provide financial advice.

## Datafeed Contract

Lightweight Charts uses the same public datafeed base:

```text
/api/datafeed
```

The base exposes:

- `/config`
- `/search?query=NVDA`
- `/symbols?symbol=NASDAQ:NVDA`
- `/history?symbol=NASDAQ:NVDA&resolution=D&from=<unix>&to=<unix>`
- `/time`
- `/status` for Chart Review Lab health checks

The backend keeps Alpaca credentials server-side and returns UDF-style history payloads with `s`, `t`, `o`, `h`, `l`, `c`, and `v` fields.

## Advanced Charts Boundary

Advanced Charts is not an active implementation path for this personal-use project. The archived adapter scaffold remains only as historical mapping context and must not be presented as pending approval.

The archived adapter exposed these review-only concepts:

- `createShape`
- `createMultipointShape`
- `getAllShapes`
- `removeEntity`
- `renderAnnotation`
- `renderAnnotations`
- `clearReviewDrawings`

The adapter does not call `createExecutionShape`, Trading Platform APIs, broker APIs, order APIs, account state, portfolio state, or alerting APIs.

If this project is ever moved under a qualifying company/public-application license, create a new issue and decision record before reopening any Advanced Charts work. Do not load or commit private assets without explicit approved access.

## Validation

Before shipping changes to this repo:

1. Confirm no private files are tracked:

```sh
if git ls-files | rg "charting_library|vendor/tradingview|datafeeds/udf"; then
  echo "remove private tracked files before review"
else
  echo "ok: no private Advanced Charts assets are tracked"
fi
```

2. Confirm the datafeed is healthy:

```sh
curl -sS https://chartreviewlab.company/api/datafeed/status
curl -sS "https://chartreviewlab.company/api/datafeed/history?symbol=NASDAQ:NVDA&resolution=D&from=0&to=9999999999"
```

3. Syntax-check local public scripts:

```sh
node --check prototype.js
node --check advanced-charts-adapter.js
```

4. Browser-check `/`, `/prototype`, `/widget-demo`, `/advanced-charts`, `/evidence`, and `/api/datafeed/status`.
5. Verify `/prototype` presents Lightweight Charts as the primary path.
6. Verify `/advanced-charts` says Advanced Charts was declined for personal use and does not imply access is pending.
