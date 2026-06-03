(() => {
  const TIMEFRAMES = {
    D: { label: "Daily", lookbackDays: 260, staleDays: 10 },
    "60": { label: "1H", lookbackDays: 45, staleDays: 5 },
    "15": { label: "15M", lookbackDays: 20, staleDays: 4 },
    W: { label: "Weekly", lookbackDays: 900, staleDays: 21 }
  };

  const COLORS = {
    levelHigh: "#0f766e",
    levelLow: "#b42318",
    range: "#1d4ed8",
    fib: "#b45309",
    projection: "#334155",
    label: "#121821"
  };

  const state = {
    chart: null,
    series: null,
    resizeObserver: null,
    symbol: "NASDAQ:NVDA",
    resolution: "D",
    candles: [],
    annotations: [],
    selectedId: null,
    filter: "all",
    overlayVisible: true,
    statusPayload: null,
    lastEndpoint: "",
    stale: false
  };

  const dom = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    bindDom();
    bindEvents();

    if (!window.LightweightCharts) {
      setChartState("error", "Chart renderer failed to load", "Refresh the page or check the CDN connection.");
      setFeedStatus("error", "Renderer unavailable");
      return;
    }

    createChart();
    loadData();
  }

  function bindDom() {
    dom.feedStatus = document.getElementById("feed-status-pill");
    dom.symbolSelect = document.getElementById("symbol-select");
    dom.resolutionButtons = Array.from(document.querySelectorAll("[data-resolution]"));
    dom.filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
    dom.clearButton = document.getElementById("clear-annotations");
    dom.chartContainer = document.getElementById("prototype-chart");
    dom.overlay = document.getElementById("annotation-overlay");
    dom.chartState = document.getElementById("chart-state");
    dom.chartSourceLabel = document.getElementById("chart-source-label");
    dom.latestBarLabel = document.getElementById("latest-bar-label");
    dom.reviewWindowLabel = document.getElementById("review-window-label");
    dom.selectedTitle = document.getElementById("selected-annotation-title");
    dom.selectedSummary = document.getElementById("selected-annotation-summary");
    dom.selectedValues = document.getElementById("selected-annotation-values");
    dom.annotationList = document.getElementById("annotation-list");
    dom.sourceMetadata = document.getElementById("source-metadata");
    dom.annotationJson = document.getElementById("annotation-json");
    dom.copyJson = document.getElementById("copy-json");
    dom.downloadJson = document.getElementById("download-json");
    dom.downloadChart = document.getElementById("download-chart");
    dom.copySource = document.getElementById("copy-source");
  }

  function bindEvents() {
    dom.symbolSelect.addEventListener("change", () => {
      state.symbol = dom.symbolSelect.value;
      loadData();
    });

    dom.resolutionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.resolution = button.dataset.resolution;
        dom.resolutionButtons.forEach((item) => item.classList.toggle("active", item === button));
        loadData();
      });
    });

    dom.filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        state.filter = button.dataset.filter;
        state.overlayVisible = true;
        dom.filterButtons.forEach((item) => item.classList.toggle("active", item === button));
        drawAnnotations();
        renderAnnotations();
      });
    });

    dom.clearButton.addEventListener("click", toggleOverlay);

    dom.copyJson.addEventListener("click", () => copyText(annotationPayloadText(), dom.copyJson, "Copied JSON"));
    dom.downloadJson.addEventListener("click", downloadJson);
    dom.downloadChart.addEventListener("click", downloadChartImage);
    dom.copySource.addEventListener("click", () => copyText(sourceSummaryText(), dom.copySource, "Copied source"));
  }

  function createChart() {
    const rect = dom.chartContainer.getBoundingClientRect();
    const colorType = window.LightweightCharts.ColorType?.Solid ?? "solid";
    state.chart = window.LightweightCharts.createChart(dom.chartContainer, {
      width: Math.max(rect.width, 320),
      height: Math.max(rect.height, 360),
      layout: {
        background: { type: colorType, color: "#ffffff" },
        textColor: "#334155",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
      },
      grid: {
        vertLines: { color: "#edf2f7" },
        horzLines: { color: "#edf2f7" }
      },
      rightPriceScale: {
        borderColor: "#d8dee8",
        scaleMargins: { top: 0.18, bottom: 0.18 }
      },
      timeScale: {
        borderColor: "#d8dee8",
        timeVisible: true,
        secondsVisible: false
      },
      crosshair: {
        mode: window.LightweightCharts.CrosshairMode.Normal
      }
    });

    state.series = state.chart.addCandlestickSeries({
      upColor: "#0f766e",
      downColor: "#b42318",
      borderUpColor: "#0f766e",
      borderDownColor: "#b42318",
      wickUpColor: "#0f766e",
      wickDownColor: "#b42318",
      priceLineColor: "#64748b",
      lastValueVisible: true
    });

    state.resizeObserver = new ResizeObserver(() => {
      const bounds = dom.chartContainer.getBoundingClientRect();
      state.chart.resize(Math.max(bounds.width, 320), Math.max(bounds.height, 360));
      drawAnnotations();
    });
    state.resizeObserver.observe(dom.chartContainer);
    state.chart.timeScale().subscribeVisibleTimeRangeChange(drawAnnotations);
  }

  async function loadData() {
    setChartState("loading", "Loading Alpaca-backed candles", "Fetching OHLCV through the server-side UDF datafeed.");
    setFeedStatus("neutral", "Loading datafeed");
    state.annotations = [];
    state.selectedId = null;
    state.overlayVisible = true;
    state.stale = false;
    drawAnnotations();
    renderAnnotations();

    const endpoint = buildHistoryUrl();
    state.lastEndpoint =
      endpoint.origin === window.location.origin ? endpoint.pathname + endpoint.search : endpoint.toString();
    dom.chartSourceLabel.textContent = state.lastEndpoint;

    try {
      const historyPayload = await fetchJson(endpoint);
      state.statusPayload = await fetchStatusPayload();

      if (historyPayload.s === "error") {
        throw new Error(historyPayload.errmsg || "Datafeed returned an error.");
      }

      const candles = parseHistory(historyPayload);
      state.candles = candles;

      if (!candles.length) {
        state.series.setData([]);
        updateStageMeta();
        setChartState("empty", "No candles returned", "The selected symbol and timeframe produced an empty UDF history response.");
        setFeedStatus("pending", "No data returned");
        updateSourceMetadata();
        return;
      }

      state.series.setData(candles);
      state.chart.timeScale().fitContent();
      state.annotations = buildAnnotations(candles);
      state.selectedId = state.annotations[0]?.id ?? null;
      state.stale = isStale(candles.at(-1)?.time);

      updateStageMeta();
      renderAnnotations();
      drawAnnotations();

      if (state.stale) {
        setChartState("stale", "Latest bar looks stale", "The chart remains inspectable, but the latest returned bar is older than the expected review window.");
        setFeedStatus("pending", "Data stale");
      } else {
        hideChartState();
        setFeedStatus("ok", "Datafeed ok");
      }
    } catch (error) {
      state.candles = [];
      state.annotations = [];
      state.selectedId = null;
      state.series.setData([]);
      setChartState("error", "Datafeed error", error.message);
      setFeedStatus("error", "Datafeed error");
      updateStageMeta();
      renderAnnotations();
      drawAnnotations();
    }
  }

  function buildHistoryUrl() {
    const now = Math.floor(Date.now() / 1000);
    const timeframe = TIMEFRAMES[state.resolution] || TIMEFRAMES.D;
    const from = now - timeframe.lookbackDays * 24 * 60 * 60;
    const url = datafeedUrl("/history");
    url.searchParams.set("symbol", state.symbol);
    url.searchParams.set("resolution", state.resolution);
    url.searchParams.set("from", String(from));
    url.searchParams.set("to", String(now));
    return url;
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.errmsg || payload.message || `Request failed with ${response.status}.`);
    }
    return payload;
  }

  async function fetchStatusPayload() {
    const url = datafeedUrl("/status");
    url.searchParams.set("symbol", state.symbol);
    url.searchParams.set("resolution", state.resolution);
    try {
      return await fetchJson(url);
    } catch (error) {
      return {
        ok: false,
        message: error.message,
        feed: "unknown"
      };
    }
  }

  function datafeedUrl(path) {
    const overrideBase = new URLSearchParams(window.location.search).get("datafeedBase");
    if (overrideBase) {
      return new URL(`${overrideBase.replace(/\/+$/, "")}${path}`);
    }
    return new URL(`/api/datafeed${path}`, window.location.origin);
  }

  function parseHistory(payload) {
    if (payload.s === "no_data") {
      return [];
    }

    const times = Array.isArray(payload.t) ? payload.t : [];
    return times
      .map((time, index) => ({
        time: Number(time),
        open: Number(payload.o?.[index]),
        high: Number(payload.h?.[index]),
        low: Number(payload.l?.[index]),
        close: Number(payload.c?.[index]),
        volume: Number(payload.v?.[index] ?? 0)
      }))
      .filter(
        (bar) =>
          Number.isFinite(bar.time) &&
          Number.isFinite(bar.open) &&
          Number.isFinite(bar.high) &&
          Number.isFinite(bar.low) &&
          Number.isFinite(bar.close)
      );
  }

  function buildAnnotations(candles) {
    const review = candles.slice(-Math.min(candles.length, 80));
    const rangeBars = review.slice(0, Math.max(4, Math.min(20, Math.floor(review.length * 0.25))));
    const reviewHigh = maxBar(review, "high");
    const reviewLow = minBar(review, "low");
    const rangeHigh = maxBar(rangeBars, "high");
    const rangeLow = minBar(rangeBars, "low");
    const latest = candles.at(-1);
    const span = Math.max(reviewHigh.high - reviewLow.low, 0.01);
    const rangeSpan = Math.max(rangeHigh.high - rangeLow.low, 0.01);
    const fibLevels = [0.382, 0.5, 0.618].map((ratio) => ({
      ratio,
      price: reviewHigh.high - span * ratio
    }));
    const projectionLevels = [
      { label: "Upper measured reference", price: rangeHigh.high + rangeSpan * 0.382 },
      { label: "Lower measured reference", price: rangeLow.low - rangeSpan * 0.382 }
    ];

    const source = {
      symbol: state.symbol,
      timeframe: TIMEFRAMES[state.resolution]?.label ?? state.resolution,
      resolution: state.resolution,
      endpoint: state.lastEndpoint,
      barsReviewed: review.length,
      generatedAt: new Date().toISOString()
    };

    return [
      {
        id: "level-review-high",
        group: "levels",
        type: "horizontal_level",
        label: "Review high",
        color: COLORS.levelHigh,
        summary: "Highest high in the recent review window.",
        values: {
          price: roundPrice(reviewHigh.high),
          time: formatDateTime(reviewHigh.time),
          basis: "max high across recent review bars"
        },
        draw: {
          price: reviewHigh.high
        },
        source
      },
      {
        id: "level-review-low",
        group: "levels",
        type: "horizontal_level",
        label: "Review low",
        color: COLORS.levelLow,
        summary: "Lowest low in the recent review window.",
        values: {
          price: roundPrice(reviewLow.low),
          time: formatDateTime(reviewLow.time),
          basis: "min low across recent review bars"
        },
        draw: {
          price: reviewLow.low
        },
        source
      },
      {
        id: "range-reference",
        group: "range",
        type: "range_box",
        label: "Reference range",
        color: COLORS.range,
        summary: "Box built from the first segment of the recent review window.",
        values: {
          start: formatDateTime(rangeBars[0].time),
          end: formatDateTime(rangeBars.at(-1).time),
          high: roundPrice(rangeHigh.high),
          low: roundPrice(rangeLow.low),
          bars: rangeBars.length
        },
        draw: {
          startTime: rangeBars[0].time,
          endTime: rangeBars.at(-1).time,
          high: rangeHigh.high,
          low: rangeLow.low
        },
        source
      },
      {
        id: "fib-reference",
        group: "fib",
        type: "fib_style_levels",
        label: "Fib-style references",
        color: COLORS.fib,
        summary: "Retracement-style reference lines between the review high and review low.",
        values: Object.fromEntries(
          fibLevels.map((level) => [`${Math.round(level.ratio * 1000) / 10}%`, roundPrice(level.price)])
        ),
        draw: {
          levels: fibLevels,
          startTime: review[0].time,
          endTime: latest.time
        },
        source
      },
      {
        id: "measured-projection",
        group: "projection",
        type: "measured_projection",
        label: "Measured projection",
        color: COLORS.projection,
        summary: "Range height projected above and below the reference range for visual comparison.",
        values: {
          rangeHeight: roundPrice(rangeSpan),
          upper: roundPrice(projectionLevels[0].price),
          lower: roundPrice(projectionLevels[1].price)
        },
        draw: {
          startTime: rangeBars[0].time,
          endTime: rangeBars.at(-1).time,
          high: rangeHigh.high,
          low: rangeLow.low,
          levels: projectionLevels
        },
        source
      },
      {
        id: "text-labels",
        group: "labels",
        type: "text_labels",
        label: "Text labels",
        color: COLORS.label,
        summary: "Plain-language labels attached to the latest bar and review extremes.",
        values: {
          latestClose: roundPrice(latest.close),
          latestTime: formatDateTime(latest.time),
          labels: 3
        },
        draw: {
          labels: [
            { text: "Latest close", time: latest.time, price: latest.close },
            { text: "Review high", time: reviewHigh.time, price: reviewHigh.high },
            { text: "Review low", time: reviewLow.time, price: reviewLow.low }
          ]
        },
        source
      }
    ];
  }

  function maxBar(bars, key) {
    return bars.reduce((best, bar) => (bar[key] > best[key] ? bar : best), bars[0]);
  }

  function minBar(bars, key) {
    return bars.reduce((best, bar) => (bar[key] < best[key] ? bar : best), bars[0]);
  }

  function drawAnnotations() {
    dom.overlay.innerHTML = "";
    const bounds = dom.chartContainer.getBoundingClientRect();
    const width = Math.max(Math.round(bounds.width), 320);
    const height = Math.max(Math.round(bounds.height), 360);
    dom.overlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
    dom.overlay.setAttribute("width", String(width));
    dom.overlay.setAttribute("height", String(height));

    if (!state.overlayVisible || !state.annotations.length || !state.series || !state.chart) {
      return;
    }

    const annotations = visibleAnnotations();
    annotations.forEach((annotation) => {
      const selected = annotation.id === state.selectedId;
      if (annotation.type === "horizontal_level") {
        drawHorizontalLevel(annotation, width, selected);
      } else if (annotation.type === "range_box") {
        drawRangeBox(annotation, selected);
      } else if (annotation.type === "fib_style_levels") {
        drawFibLevels(annotation, width, selected);
      } else if (annotation.type === "measured_projection") {
        drawProjection(annotation, width, selected);
      } else if (annotation.type === "text_labels") {
        drawTextLabels(annotation, selected);
      }
    });
  }

  function visibleAnnotations() {
    if (state.filter === "all") {
      return state.annotations;
    }
    return state.annotations.filter((annotation) => annotation.group === state.filter);
  }

  function drawHorizontalLevel(annotation, width, selected) {
    const y = yForPrice(annotation.draw.price);
    if (!isFiniteCoordinate(y)) return;
    appendLine(0, y, width, y, annotation.color, selected ? 3 : 2, selected ? "none" : "7 5");
    appendSvgLabel(annotation.label, 12, y - 8, annotation.color);
  }

  function drawRangeBox(annotation, selected) {
    const x1 = xForTime(annotation.draw.startTime);
    const x2 = xForTime(annotation.draw.endTime);
    const yHigh = yForPrice(annotation.draw.high);
    const yLow = yForPrice(annotation.draw.low);
    if (![x1, x2, yHigh, yLow].every(isFiniteCoordinate)) return;

    const left = Math.min(x1, x2);
    const top = Math.min(yHigh, yLow);
    const width = Math.max(Math.abs(x2 - x1), 12);
    const height = Math.max(Math.abs(yLow - yHigh), 12);
    const rect = svgElement("rect", {
      x: left,
      y: top,
      width,
      height,
      rx: 3,
      fill: "rgba(29, 78, 216, 0.10)",
      stroke: annotation.color,
      "stroke-width": selected ? 3 : 2
    });
    dom.overlay.appendChild(rect);
    appendSvgLabel(annotation.label, left + 8, top + 18, annotation.color);
  }

  function drawFibLevels(annotation, width, selected) {
    annotation.draw.levels.forEach((level) => {
      const y = yForPrice(level.price);
      if (!isFiniteCoordinate(y)) return;
      const label = `${Math.round(level.ratio * 1000) / 10}%`;
      appendLine(0, y, width, y, annotation.color, selected ? 2.5 : 1.5, "4 5");
      appendSvgLabel(label, Math.max(width - 92, 12), y - 7, annotation.color);
    });
  }

  function drawProjection(annotation, width, selected) {
    const x1 = xForTime(annotation.draw.startTime);
    const x2 = xForTime(annotation.draw.endTime);
    const yLow = yForPrice(annotation.draw.low);
    const yHigh = yForPrice(annotation.draw.high);
    if ([x1, x2, yLow, yHigh].every(isFiniteCoordinate)) {
      appendLine(x1, yLow, x2, yHigh, annotation.color, selected ? 3 : 2, "8 6");
    }

    annotation.draw.levels.forEach((level) => {
      const y = yForPrice(level.price);
      if (!isFiniteCoordinate(y)) return;
      appendLine(0, y, width, y, annotation.color, selected ? 2.5 : 1.5, "2 6");
      appendSvgLabel(level.label, 12, y - 7, annotation.color);
    });
  }

  function drawTextLabels(annotation, selected) {
    annotation.draw.labels.forEach((label) => {
      const x = xForTime(label.time);
      const y = yForPrice(label.price);
      if (!isFiniteCoordinate(x) || !isFiniteCoordinate(y)) return;
      appendSvgLabel(label.text, x + 8, y - 10, annotation.color, selected);
    });
  }

  function xForTime(time) {
    return state.chart.timeScale().timeToCoordinate(time);
  }

  function yForPrice(price) {
    return state.series.priceToCoordinate(price);
  }

  function isFiniteCoordinate(value) {
    return Number.isFinite(value) && value > -2000 && value < 4000;
  }

  function appendLine(x1, y1, x2, y2, color, width, dash) {
    dom.overlay.appendChild(
      svgElement("line", {
        x1,
        y1,
        x2,
        y2,
        stroke: color,
        "stroke-width": width,
        "stroke-dasharray": dash,
        "stroke-linecap": "round"
      })
    );
  }

  function appendSvgLabel(text, x, y, color, selected = false) {
    const group = svgElement("g", { class: selected ? "svg-label selected" : "svg-label" });
    const labelWidth = Math.max(text.length * 7 + 14, 54);
    group.appendChild(
      svgElement("rect", {
        x,
        y: y - 14,
        width: labelWidth,
        height: 20,
        rx: 3,
        fill: selected ? "#121821" : "#ffffff",
        stroke: color,
        "stroke-width": selected ? 1.5 : 1
      })
    );
    const label = svgElement("text", {
      x: x + 7,
      y,
      fill: selected ? "#ffffff" : color,
      "font-size": 12,
      "font-weight": 800,
      "font-family": "Inter, ui-sans-serif, system-ui, sans-serif"
    });
    label.textContent = text;
    group.appendChild(label);
    dom.overlay.appendChild(group);
  }

  function svgElement(tag, attributes) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
    return node;
  }

  function renderAnnotations() {
    const selected = state.annotations.find((annotation) => annotation.id === state.selectedId) || null;
    renderSelectedAnnotation(selected);
    renderAnnotationList();
    updateSourceMetadata();
    dom.annotationJson.textContent = annotationPayloadText();
  }

  function renderSelectedAnnotation(annotation) {
    dom.selectedValues.innerHTML = "";

    if (!annotation) {
      dom.selectedTitle.textContent = "No annotation selected";
      dom.selectedSummary.textContent = state.candles.length
        ? "Select an annotation row to inspect its values."
        : "Load a symbol and timeframe to inspect deterministic review artifacts.";
      return;
    }

    dom.selectedTitle.textContent = annotation.label;
    dom.selectedSummary.textContent = annotation.summary;
    Object.entries(annotation.values).forEach(([key, value]) => {
      const dt = document.createElement("dt");
      dt.textContent = labelize(key);
      const dd = document.createElement("dd");
      dd.textContent = String(value);
      dom.selectedValues.append(dt, dd);
    });
  }

  function renderAnnotationList() {
    dom.annotationList.innerHTML = "";

    if (!state.annotations.length) {
      dom.clearButton.textContent = "Clear overlay";
      const empty = document.createElement("p");
      empty.className = "muted-note";
      empty.textContent = "No annotation artifacts are available for the current chart state.";
      dom.annotationList.appendChild(empty);
      return;
    }

    state.annotations.forEach((annotation) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "annotation-row";
      button.classList.toggle("selected", annotation.id === state.selectedId);
      button.classList.toggle("dimmed", state.filter !== "all" && annotation.group !== state.filter);
      button.addEventListener("click", () => {
        state.selectedId = annotation.id;
        state.overlayVisible = true;
        renderAnnotations();
        drawAnnotations();
      });

      const name = document.createElement("strong");
      name.textContent = annotation.label;
      const meta = document.createElement("span");
      meta.textContent = `${annotation.type} / ${annotation.group}`;
      button.append(name, meta);
      dom.annotationList.appendChild(button);
    });

    dom.clearButton.textContent = state.overlayVisible ? "Clear overlay" : "Restore overlay";
  }

  function toggleOverlay() {
    state.overlayVisible = !state.overlayVisible;
    drawAnnotations();
    renderAnnotations();
  }

  function updateStageMeta() {
    const latest = state.candles.at(-1);
    const first = state.candles[0];
    dom.latestBarLabel.textContent = latest ? formatDateTime(latest.time) : "No bar";
    dom.reviewWindowLabel.textContent = first && latest
      ? `${formatDateTime(first.time)} to ${formatDateTime(latest.time)}`
      : "Not loaded";
  }

  function updateSourceMetadata() {
    dom.sourceMetadata.innerHTML = "";
    const latest = state.candles.at(-1);
    const metadata = {
      Symbol: state.symbol,
      Timeframe: TIMEFRAMES[state.resolution]?.label ?? state.resolution,
      Endpoint: state.lastEndpoint || "/api/datafeed/history",
      Bars: state.candles.length,
      Feed: state.statusPayload?.feed ?? "unknown",
      "Status ok": state.statusPayload?.ok === true ? "true" : "false",
      "Latest bar": latest ? formatDateTime(latest.time) : "none",
      "Stale check": state.stale ? "stale" : "current"
    };

    Object.entries(metadata).forEach(([key, value]) => {
      const dt = document.createElement("dt");
      dt.textContent = key;
      const dd = document.createElement("dd");
      dd.textContent = String(value);
      dom.sourceMetadata.append(dt, dd);
    });
  }

  function setChartState(kind, title, message) {
    dom.chartState.hidden = false;
    dom.chartState.dataset.state = kind;
    dom.chartState.querySelector("strong").textContent = title;
    dom.chartState.querySelector("p").textContent = message;
  }

  function hideChartState() {
    dom.chartState.hidden = true;
  }

  function setFeedStatus(kind, text) {
    dom.feedStatus.textContent = text;
    dom.feedStatus.className = "status-pill";
    if (kind === "ok") {
      dom.feedStatus.classList.add("ok");
    } else if (kind === "error") {
      dom.feedStatus.classList.add("error");
    } else if (kind === "pending") {
      dom.feedStatus.classList.add("pending");
    } else {
      dom.feedStatus.classList.add("neutral");
    }
  }

  function isStale(latestTime) {
    if (!latestTime) return false;
    const threshold = (TIMEFRAMES[state.resolution] || TIMEFRAMES.D).staleDays;
    const ageDays = (Date.now() - latestTime * 1000) / (24 * 60 * 60 * 1000);
    return ageDays > threshold;
  }

  function annotationPayloadText() {
    return JSON.stringify(
      {
        source: {
          symbol: state.symbol,
          resolution: state.resolution,
          timeframe: TIMEFRAMES[state.resolution]?.label ?? state.resolution,
          endpoint: state.lastEndpoint,
          feed: state.statusPayload?.feed ?? "unknown",
          bars: state.candles.length,
          latestBarTime: state.candles.at(-1) ? formatDateTime(state.candles.at(-1).time) : null,
          stale: state.stale,
          generatedAt: new Date().toISOString()
        },
        visibleFilter: state.overlayVisible ? state.filter : "none",
        selectedAnnotationId: state.selectedId,
        annotations: state.annotations
      },
      null,
      2
    );
  }

  function sourceSummaryText() {
    const latest = state.candles.at(-1);
    return [
      `symbol=${state.symbol}`,
      `resolution=${state.resolution}`,
      `endpoint=${state.lastEndpoint}`,
      `feed=${state.statusPayload?.feed ?? "unknown"}`,
      `bars=${state.candles.length}`,
      `latest=${latest ? formatDateTime(latest.time) : "none"}`,
      `stale=${state.stale}`
    ].join("\n");
  }

  async function copyText(text, button, copiedLabel) {
    const original = button.textContent;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = copiedLabel;
    } catch {
      button.textContent = "Copy unavailable";
    }
    window.setTimeout(() => {
      button.textContent = original;
    }, 1200);
  }

  function downloadJson() {
    const blob = new Blob([annotationPayloadText()], { type: "application/json;charset=utf-8" });
    downloadBlob(blob, `${filenameStem()}-annotations.json`);
  }

  async function downloadChartImage() {
    if (!state.chart || typeof state.chart.takeScreenshot !== "function") {
      dom.downloadChart.textContent = "Image unavailable";
      window.setTimeout(() => {
        dom.downloadChart.textContent = "Chart image";
      }, 1200);
      return;
    }

    const chartCanvas = state.chart.takeScreenshot();
    const canvas = document.createElement("canvas");
    canvas.width = chartCanvas.width;
    canvas.height = chartCanvas.height;
    const context = canvas.getContext("2d");
    context.drawImage(chartCanvas, 0, 0);

    try {
      const overlayImage = await svgToImage(dom.overlay);
      context.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);
    } catch {
      // The chart image still captures the candle renderer if SVG serialization is unavailable.
    }

    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob(blob, `${filenameStem()}-chart.png`);
      }
    }, "image/png");
  }

  function svgToImage(svg) {
    const text = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([text], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    return new Promise((resolve, reject) => {
      image.onload = () => {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Overlay image failed to load."));
      };
      image.src = url;
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function filenameStem() {
    return `${state.symbol.replace(/[^A-Z0-9]+/gi, "-").toLowerCase()}-${state.resolution.toLowerCase()}`;
  }

  function roundPrice(value) {
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatDateTime(time) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(Number(time) * 1000));
  }

  function labelize(value) {
    return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
  }
})();
