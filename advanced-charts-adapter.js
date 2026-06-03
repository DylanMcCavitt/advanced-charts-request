(() => {
  "use strict";

  const DATAFEED_BASE_URL = "/api/datafeed";
  const LIBRARY_STATUS = "pending_tradingview_approval";
  const REQUIRED_DRAWING_METHODS = Object.freeze([
    "createShape",
    "createMultipointShape",
    "getAllShapes",
    "removeEntity"
  ]);

  const ANNOTATION_DRAWING_CONTRACTS = Object.freeze([
    {
      prototypeType: "horizontal_level",
      officialMethod: "createShape",
      shape: "horizontal_line",
      pointSource: "draw.price plus context.anchorTime or context.latestBarTime"
    },
    {
      prototypeType: "range_box",
      officialMethod: "createMultipointShape",
      shape: "rectangle",
      pointSource: "draw.startTime, draw.endTime, draw.high, draw.low"
    },
    {
      prototypeType: "fib_style_levels",
      officialMethod: "createShape",
      shape: "horizontal_line",
      pointSource: "draw.levels[] with context.anchorTime or context.latestBarTime"
    },
    {
      prototypeType: "measured_projection",
      officialMethod: "createMultipointShape and createShape",
      shape: "trend_line and horizontal_line",
      pointSource: "draw.startTime, draw.endTime, draw.high, draw.low, draw.levels[]"
    },
    {
      prototypeType: "text_labels",
      officialMethod: "createShape",
      shape: "text",
      pointSource: "draw.labels[]"
    }
  ]);

  function createReviewDrawingAdapter(chartApi) {
    assertDrawingApi(chartApi);

    return {
      createShape(point, options) {
        return chartApi.createShape(point, options);
      },
      createMultipointShape(points, options) {
        return chartApi.createMultipointShape(points, options);
      },
      getAllShapes() {
        return chartApi.getAllShapes();
      },
      removeEntity(entityId) {
        return chartApi.removeEntity(entityId);
      },
      async renderAnnotation(annotation, context = {}) {
        const calls = mapPrototypeAnnotationToDrawingCalls(annotation, context);
        return applyDrawingCalls(chartApi, calls);
      },
      async renderAnnotations(annotations, context = {}) {
        const ids = [];
        for (const annotation of annotations) {
          const rendered = await this.renderAnnotation(annotation, context);
          ids.push(...rendered);
        }
        return ids;
      },
      async clearReviewDrawings(entityIds) {
        const ids = Array.isArray(entityIds) ? entityIds : [];
        for (const entityId of ids) {
          await chartApi.removeEntity(entityId);
        }
        return ids.length;
      }
    };
  }

  function createPendingAdvancedChartsAdapter() {
    const pending = () => {
      throw new Error("TradingView Advanced Charts access is pending; no private library is loaded.");
    };

    return {
      status: LIBRARY_STATUS,
      createShape: pending,
      createMultipointShape: pending,
      getAllShapes: () => [],
      removeEntity: pending,
      renderAnnotation: pending,
      renderAnnotations: pending,
      clearReviewDrawings: pending
    };
  }

  function mapPrototypeAnnotationToDrawingCalls(annotation, context = {}) {
    if (!annotation || typeof annotation !== "object") {
      throw new Error("A prototype annotation object is required.");
    }

    const color = annotation.color || "#1d4ed8";
    const label = annotation.label || annotation.id || annotation.type || "Review annotation";

    if (annotation.type === "horizontal_level") {
      return [
        {
          method: "createShape",
          args: [
            pricedPoint(anchorTime(annotation, context), annotation.draw?.price),
            shapeOptions("horizontal_line", label, color)
          ],
          annotationId: annotation.id
        }
      ];
    }

    if (annotation.type === "range_box") {
      return [
        {
          method: "createMultipointShape",
          args: [
            [
              pricedPoint(annotation.draw?.startTime, annotation.draw?.high),
              pricedPoint(annotation.draw?.endTime, annotation.draw?.low)
            ],
            shapeOptions("rectangle", label, color)
          ],
          annotationId: annotation.id
        }
      ];
    }

    if (annotation.type === "fib_style_levels") {
      return asArray(annotation.draw?.levels).map((level) => ({
        method: "createShape",
        args: [
          pricedPoint(anchorTime(annotation, context), level.price),
          shapeOptions("horizontal_line", `${label} ${formatRatio(level.ratio)}`, color)
        ],
        annotationId: annotation.id
      }));
    }

    if (annotation.type === "measured_projection") {
      const calls = [
        {
          method: "createMultipointShape",
          args: [
            [
              pricedPoint(annotation.draw?.startTime, annotation.draw?.low),
              pricedPoint(annotation.draw?.endTime, annotation.draw?.high)
            ],
            shapeOptions("trend_line", label, color)
          ],
          annotationId: annotation.id
        }
      ];

      asArray(annotation.draw?.levels).forEach((level) => {
        calls.push({
          method: "createShape",
          args: [
            pricedPoint(anchorTime(annotation, context), level.price),
            shapeOptions("horizontal_line", level.label || label, color)
          ],
          annotationId: annotation.id
        });
      });

      return calls;
    }

    if (annotation.type === "text_labels") {
      return asArray(annotation.draw?.labels).map((item) => ({
        method: "createShape",
        args: [
          pricedPoint(item.time, item.price),
          shapeOptions("text", item.text || label, color)
        ],
        annotationId: annotation.id
      }));
    }

    throw new Error(`Unsupported prototype annotation type: ${annotation.type}`);
  }

  function buildAdvancedChartsWidgetOptions({
    container = "advanced-charts-container",
    datafeed,
    libraryPath = "/vendor/tradingview/charting_library/",
    symbol = "NASDAQ:NVDA",
    interval = "D"
  } = {}) {
    if (!datafeed) {
      throw new Error("An approved Advanced Charts datafeed instance is required.");
    }

    return {
      container,
      library_path: libraryPath,
      datafeed,
      symbol,
      interval,
      timezone: "America/New_York",
      locale: "en",
      theme: "light",
      autosize: true
    };
  }

  function createUdfDatafeed(datafeedsNamespace, datafeedBaseUrl = DATAFEED_BASE_URL) {
    const Datafeeds = datafeedsNamespace || globalThis.Datafeeds;
    if (!Datafeeds || typeof Datafeeds.UDFCompatibleDatafeed !== "function") {
      throw new Error("The approved UDF datafeed bundle is not loaded.");
    }
    return new Datafeeds.UDFCompatibleDatafeed(datafeedBaseUrl);
  }

  async function applyDrawingCalls(chartApi, calls) {
    const entityIds = [];
    for (const call of calls) {
      if (call.method === "createShape") {
        entityIds.push(await chartApi.createShape(...call.args));
      } else if (call.method === "createMultipointShape") {
        entityIds.push(await chartApi.createMultipointShape(...call.args));
      } else {
        throw new Error(`Unsupported drawing call: ${call.method}`);
      }
    }
    return entityIds;
  }

  function assertDrawingApi(chartApi) {
    if (!chartApi || typeof chartApi !== "object") {
      throw new Error("An Advanced Charts IChartWidgetApi instance is required.");
    }

    const missing = REQUIRED_DRAWING_METHODS.filter((method) => typeof chartApi[method] !== "function");
    if (missing.length) {
      throw new Error(`Advanced Charts drawing API missing methods: ${missing.join(", ")}`);
    }
  }

  function anchorTime(annotation, context) {
    const value =
      context.anchorTime ??
      context.latestBarTime ??
      annotation.draw?.time ??
      annotation.source?.latestBarTime;
    return finiteNumber(value, "context.anchorTime or context.latestBarTime");
  }

  function pricedPoint(time, price) {
    return {
      time: finiteNumber(time, "drawing time"),
      price: finiteNumber(price, "drawing price")
    };
  }

  function shapeOptions(shape, text, color) {
    return {
      shape,
      text,
      lock: true,
      overrides: {
        color,
        linecolor: color,
        textcolor: color,
        backgroundColor: "#ffffff"
      }
    };
  }

  function finiteNumber(value, name) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      throw new Error(`A finite ${name} is required for the Advanced Charts drawing contract.`);
    }
    return number;
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function formatRatio(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "";
    }
    return `${Math.round(number * 1000) / 10}%`;
  }

  const api = Object.freeze({
    ANNOTATION_DRAWING_CONTRACTS,
    DATAFEED_BASE_URL,
    LIBRARY_STATUS,
    REQUIRED_DRAWING_METHODS,
    buildAdvancedChartsWidgetOptions,
    createPendingAdvancedChartsAdapter,
    createReviewDrawingAdapter,
    createUdfDatafeed,
    mapPrototypeAnnotationToDrawingCalls
  });

  globalThis.ChartReviewLabAdvancedChartsAdapter = api;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})();
