# Chart Review Lab Context

## Product Contract

Chart Review Lab is a public chart-review artifact viewer and evidence surface.

It owns:

- deterministic browser rendering for public chart-review artifacts
- a stable browser and CDP-friendly surface for loading, inspecting, and exporting those artifacts
- public evidence pages and export actions grounded in the same rendered review state
- server-side market-data access needed to reproduce the reviewed candle window

It does not own:

- scanning, ranking, candidate generation, alerts, or recommendations
- broker, order, account, position, portfolio, or execution workflows
- Pine, native TradingView drawing validation, study validation, screenshots, or chartbooks
- private TradingView Advanced Charts assets or private TradingView UI integrations

## Current System Shape

This repository currently ships:

- `/` as the public product and boundary overview
- `/prototype` as the Evidence Bench reference viewer built on Lightweight Charts plus local SVG review overlays
- `/evidence` as the public artifact handoff and proof surface
- `/widget-demo` as the public TradingView widget comparison page
- `/advanced-charts` as the archived decision page for the declined Advanced Charts path
- `/api/datafeed/*` as the server-side UDF-shaped market-data surface used by the viewer

The app is intentionally quiet, evidence-first, and chart-review-only. The existing `/prototype` Evidence Bench language is the visual and source-grounding reference for future viewer states.

## Main Review Flow

The intended product flow is:

1. Upstream tools such as Quant Scan or other artifact producers generate review artifacts, source metadata, and the candle window to inspect.
2. Chart Review Lab renders that artifact set in a deterministic public viewer with stable selectors, inspectable JSON, and exportable evidence.
3. TradingView MCP can be used afterward for optional manual validation in native TradingView when the reviewer needs Pine, studies, screenshots, chartbooks, or native drawing behavior.

Upstream tools write artifacts into this lane. They do not become part of this app's product surface in this repository.

The minimum upstream handoff into Chart Review Lab is:

- a `review_artifact_v1` payload that validates against `docs/schemas/review_artifact_v1.schema.json`
- symbol and timeframe context for the review window
- candle-window bounds or equivalent replay context
- deterministic annotation or artifact payloads to render
- source metadata and reviewer-visible caveats
- evidence fields that can be exported without inventing extra state in the viewer

## Why This App Exists Beside TradingView MCP

Chart Review Lab owns the parts that are stronger in a first-party public viewer:

- deterministic rendering that the repo controls end to end
- public deployment that does not require a local TradingView session
- stable selectors and a stable API surface for browser automation and evidence capture
- artifact export grounded in owned DOM and owned review metadata
- no dependency on TradingView UI internals, session state, or page-level CDP automation

TradingView MCP remains the higher-fidelity local validation lane for:

- native TradingView drawings
- Pine and study validation
- TradingView screenshots and chartbooks
- manual comparison against TradingView's local desktop behavior

## Viewer Contract

The viewer contract after the Lightweight Charts pivot is:

- Lightweight Charts is the primary supported renderer path for public artifact review.
- The artifact viewer may grow richer load, export, and control states, but it must stay grounded in the quiet Evidence Bench workspace language already established in `/prototype`.
- Interactivity is expected for future artifact load, export, and control states, but those behaviors must stay review-only and deterministic.
- Source caveats, attribution, and latest-bar context stay visible in the reading path.
- Market-data credentials remain server-side.
- Exported evidence must reflect the same artifact state the viewer presents to the reviewer.

## Important Invariants

- Keep all copy and behavior chart-review-only.
- Do not add scanning, ranking, recommendation, alerting, or execution features.
- Do not merge broker or account workflows into this repository.
- Do not treat Quant Scan, TradingView MCP, or other upstream tools as in-repo product modules.
- Do not add private Advanced Charts bundles, copied TradingView library files, or private asset paths.
- Treat `/advanced-charts` as a historical decision record unless a new explicit decision reopens that path.
