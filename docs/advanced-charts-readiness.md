# Advanced Charts Readiness

## Status

TradingView Advanced Charts access is pending. This repository does not include private TradingView library files, copied charting library bundles, or licensed assets.

Primary references:

- TradingView Drawings API: https://www.tradingview.com/charting-library-docs/latest/ui_elements/drawings/drawings-api/
- TradingView UDF adapter: https://www.tradingview.com/charting-library-docs/latest/connecting_data/UDF/

The public placeholder route is `/advanced-charts`. It documents the guarded state and keeps the current public fallback paths available:

- `/prototype` uses Lightweight Charts with local SVG review overlays.
- `/widget-demo` uses the public TradingView widget fallback.
- `/api/datafeed` is the Alpaca-backed UDF datafeed base.

## Post-Approval Setup

Use these steps only after TradingView grants access and provides the licensed Advanced Charts package.

1. Keep the approved TradingView package outside git. For local verification, copy it into an ignored path such as `vendor/tradingview/charting_library/`.
2. Keep the UDF bundle from the approved package outside git as well, for example `vendor/tradingview/datafeeds/udf/dist/bundle.js`.
3. Load those approved files from the deployed artifact or private deployment storage. Do not commit the package, minified bundles, or license-only assets.
4. Instantiate the UDF datafeed with the existing base URL:

```js
const datafeed = new Datafeeds.UDFCompatibleDatafeed("/api/datafeed");
```

5. Create the Advanced Charts widget with the approved library path, the UDF datafeed, and the current review defaults:

```js
new TradingView.widget({
  container: "advanced-charts-container",
  library_path: "/vendor/tradingview/charting_library/",
  datafeed,
  symbol: "NASDAQ:NVDA",
  interval: "D",
  timezone: "America/New_York",
  locale: "en",
  theme: "light",
  autosize: true
});
```

6. After `onChartReady`, pass `widget.activeChart()` to the review drawing adapter in `advanced-charts-adapter.js`.
7. Map the existing prototype annotation artifacts through `mapPrototypeAnnotationToDrawingCalls(annotation, context)`, then apply the resulting calls through `createReviewDrawingAdapter(chartApi)`.
8. Keep the product boundary unchanged: chart review only, with no recommendations, rankings, alerts, broker actions, orders, positions, or execution behavior.
9. Keep attribution visible and keep Alpaca data-source caveats visible wherever chart data appears.

## UDF Datafeed Contract

Advanced Charts should use the same UDF base URL already deployed:

```text
/api/datafeed
```

The base exposes the endpoints the UDF adapter expects:

- `/config`
- `/search?query=NVDA`
- `/symbols?symbol=NASDAQ:NVDA`
- `/history?symbol=NASDAQ:NVDA&resolution=D&from=<unix>&to=<unix>`
- `/time`
- `/status` for Chart Review Lab health checks

The backend keeps Alpaca credentials server-side and returns UDF-style history payloads with `s`, `t`, `o`, `h`, `l`, `c`, and `v` fields.

## Drawing Adapter Contract

The prototype annotation JSON maps to official Advanced Charts drawing calls as follows:

| Prototype annotation type | Adapter call | Advanced Charts shape intent | Notes |
| --- | --- | --- | --- |
| `horizontal_level` | `createShape(point, options)` | horizontal line | Uses `draw.price` plus the current chart anchor time from context. |
| `range_box` | `createMultipointShape(points, options)` | rectangle | Uses `draw.startTime`, `draw.endTime`, `draw.high`, and `draw.low`. |
| `fib_style_levels` | `createShape(point, options)` per level | horizontal reference lines | Keeps the prototype's explicit review levels instead of implying a trading signal. |
| `measured_projection` | `createMultipointShape(points, options)` plus `createShape` per reference level | trend line and horizontal references | Preserves the visual comparison artifact only. |
| `text_labels` | `createShape(point, options)` per label | text labels | Uses label text, time, and price from `draw.labels`. |

The adapter exposes only review drawing methods:

- `createShape`
- `createMultipointShape`
- `getAllShapes`
- `removeEntity`
- `renderAnnotation`
- `renderAnnotations`
- `clearReviewDrawings`

It does not call `createExecutionShape`, Trading Platform APIs, broker APIs, order APIs, account state, portfolio state, or alerting APIs.

## Validation

Before switching `/advanced-charts` from pending to active:

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

4. Browser-check `/`, `/prototype`, `/widget-demo`, `/advanced-charts`, and `/api/datafeed/status`.
5. Verify the route still says Advanced Charts approval is pending until the approved package is actually loaded and the integration has been reviewed.
