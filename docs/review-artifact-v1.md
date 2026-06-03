# Review Artifact v1

`review_artifact_v1` is the small JSON handoff format for Chart Review Lab. It lets upstream tools write chart-review evidence that `/prototype` can display, inspect, copy, and export without expanding this repository into scanning, advice, alerts, account state, or execution.

Schema:

```text
docs/schemas/review_artifact_v1.schema.json
```

Sample fixtures:

```text
docs/fixtures/review_artifact_v1_nvda_daily.json
docs/fixtures/review_artifact_v1_spy_hourly.json
```

## Required Shape

- `kind`: always `review_artifact_v1`
- `symbol`, `resolution`, `timeframe`: chart context
- `dataSource`: public provider/feed/base/history route references
- `candleSource`: `mode`, bar count, review-window timestamps, latest-bar timestamp, stale flag
- `generatedAt`: artifact timestamp
- `sourceMetadata`: reviewer-visible source facts
- `caveats`: short user-facing limitations
- `viewerState`: selected annotation and visible filter
- `annotations`: deterministic review overlays using the existing prototype annotation types

Supported annotation types are `horizontal_level`, `range_box`, `fib_style_levels`, `measured_projection`, and `text_labels`.

## Upstream Writing Contract

Upstream repos such as Quant Scan should write complete JSON artifacts matching the schema, then either publish them as static JSON files or link them into Chart Review Lab with a public URL. The artifact may reference Chart Review Lab datafeed routes such as `/api/datafeed/history?...`; it must not include Alpaca keys, tokens, request headers, or any other secret material.

Writers should keep the payload review-only:

- include the chart symbol, timeframe, candle-window context, source caveats, and deterministic annotations
- avoid broad model fields that are not needed for review rendering
- keep generated timestamps explicit and stable
- use public datafeed URLs rather than embedding credentialed upstream requests

The browser validator in `review-artifact.js` rejects malformed artifacts with user-facing error text. It also rejects field names that would turn the artifact into a scanning, ranking, recommendation, alerting, account, broker, order, position, portfolio, or execution payload.
