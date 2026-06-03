(() => {
  const ARTIFACT_KIND = "review_artifact_v1";
  const ALLOWED_TOP_LEVEL_KEYS = new Set([
    "kind",
    "symbol",
    "resolution",
    "timeframe",
    "dataSource",
    "candleSource",
    "generatedAt",
    "sourceMetadata",
    "caveats",
    "viewerState",
    "annotations"
  ]);
  const ALLOWED_DATA_SOURCE_KEYS = new Set(["provider", "feed", "baseUrl", "historyUrl"]);
  const ALLOWED_CANDLE_SOURCE_KEYS = new Set([
    "mode",
    "bars",
    "windowStart",
    "windowEnd",
    "latestBarTime",
    "stale"
  ]);
  const ALLOWED_VIEWER_STATE_KEYS = new Set(["visibleFilter", "selectedAnnotationId"]);
  const ALLOWED_ANNOTATION_KEYS = new Set([
    "id",
    "group",
    "type",
    "label",
    "color",
    "summary",
    "values",
    "draw",
    "source"
  ]);
  const ALLOWED_ANNOTATION_TYPES = new Set([
    "horizontal_level",
    "range_box",
    "fib_style_levels",
    "measured_projection",
    "text_labels"
  ]);
  const FORBIDDEN_FIELD_NAMES = new Set([
    "account",
    "alert",
    "brokers",
    "broker",
    "candidate",
    "candidaterank",
    "execution",
    "order",
    "portfolio",
    "position",
    "rank",
    "recommendation",
    "score",
    "signal"
  ]);
  const SECRET_FIELD_PATTERN = /(secret|token|credential|api[_-]?key|key[_-]?id)/i;
  const SECRET_VALUE_PATTERN = /([?&](key|token|secret|api_key|api-key|apikey)=|apca-api-key-id|apca-api-secret-key)/i;

  function selectReviewArtifactSource(search, currentHref, staticArtifacts = {}) {
    const params = search instanceof URLSearchParams
      ? search
      : new URLSearchParams(String(search || "").replace(/^\?/, ""));
    const artifactUrl = (params.get("artifactUrl") || "").trim();
    const artifactKey = (params.get("artifact") || "").trim();

    if (artifactUrl) {
      const resolved = resolveReviewArtifactUrl(artifactUrl, currentHref);
      return resolved.valid
        ? { mode: "artifact", sourceType: "url", url: resolved.url, label: artifactUrl }
        : { mode: "error", error: resolved.error };
    }

    if (artifactKey) {
      const fixtureUrl = staticArtifacts[artifactKey];
      if (!fixtureUrl) {
        return { mode: "error", error: `Unknown review artifact selector: ${artifactKey}.` };
      }
      const resolved = resolveReviewArtifactUrl(fixtureUrl, currentHref);
      return resolved.valid
        ? { mode: "artifact", sourceType: "selector", url: resolved.url, label: artifactKey }
        : { mode: "error", error: resolved.error };
    }

    return { mode: "datafeed" };
  }

  function resolveReviewArtifactUrl(input, currentHref) {
    const value = String(input || "").trim();
    if (!value) {
      return { valid: false, error: "Artifact URL is required." };
    }

    let url;
    try {
      url = new URL(value, currentHref || "https://chartreviewlab.company/prototype");
    } catch {
      return { valid: false, error: "Artifact URL must be an http(s) URL or same-site path." };
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { valid: false, error: "Artifact URL must use http or https." };
    }
    if (url.username || url.password) {
      return { valid: false, error: "Artifact URL must not include credentials." };
    }
    if (SECRET_VALUE_PATTERN.test(url.search)) {
      return { valid: false, error: "Artifact URL must not include tokens, keys, or secret query values." };
    }

    return { valid: true, url: url.href };
  }

  function validateReviewArtifact(artifact) {
    const errors = [];

    if (!isObject(artifact)) {
      return {
        valid: false,
        errors: ["review_artifact_v1 must be a JSON object."]
      };
    }

    scanObject(artifact, "review_artifact_v1", errors);
    requireString(artifact.kind, "kind", errors);
    if (artifact.kind !== ARTIFACT_KIND) {
      errors.push("kind must equal review_artifact_v1.");
    }

    requireOnlyKeys(artifact, ALLOWED_TOP_LEVEL_KEYS, "review_artifact_v1", errors);
    requireString(artifact.symbol, "symbol", errors);
    requireString(artifact.resolution, "resolution", errors);
    requireString(artifact.timeframe, "timeframe", errors);
    requireIsoString(artifact.generatedAt, "generatedAt", errors);
    validateDataSource(artifact.dataSource, errors);
    validateCandleSource(artifact.candleSource, errors);
    validateRecord(artifact.sourceMetadata, "sourceMetadata", errors);
    validateStringArray(artifact.caveats, "caveats", errors);
    validateViewerState(artifact.viewerState, errors);
    validateAnnotations(artifact.annotations, errors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  function formatReviewArtifactErrors(errors) {
    if (!errors.length) {
      return "Review artifact is valid.";
    }
    return errors.map((error) => `Review artifact error: ${error}`).join("\n");
  }

  function validateDataSource(dataSource, errors) {
    if (!isObject(dataSource)) {
      errors.push("dataSource must be an object.");
      return;
    }
    requireOnlyKeys(dataSource, ALLOWED_DATA_SOURCE_KEYS, "dataSource", errors);
    requireString(dataSource.provider, "dataSource.provider", errors);
    requireString(dataSource.feed, "dataSource.feed", errors);
    requireString(dataSource.baseUrl, "dataSource.baseUrl", errors);
    requireString(dataSource.historyUrl, "dataSource.historyUrl", errors);
  }

  function validateCandleSource(candleSource, errors) {
    if (!isObject(candleSource)) {
      errors.push("candleSource must be an object.");
      return;
    }
    requireOnlyKeys(candleSource, ALLOWED_CANDLE_SOURCE_KEYS, "candleSource", errors);
    requireString(candleSource.mode, "candleSource.mode", errors);
    if (candleSource.mode !== "server_datafeed" && candleSource.mode !== "linked_public_datafeed") {
      errors.push("candleSource.mode must be server_datafeed or linked_public_datafeed.");
    }
    requireNonNegativeInteger(candleSource.bars, "candleSource.bars", errors);
    requireNullableString(candleSource.windowStart, "candleSource.windowStart", errors);
    requireNullableString(candleSource.windowEnd, "candleSource.windowEnd", errors);
    requireNullableString(candleSource.latestBarTime, "candleSource.latestBarTime", errors);
    if (typeof candleSource.stale !== "boolean") {
      errors.push("candleSource.stale must be a boolean.");
    }
  }

  function validateRecord(record, path, errors) {
    if (!isObject(record)) {
      errors.push(`${path} must be an object.`);
      return;
    }
    Object.entries(record).forEach(([key, value]) => {
      const valueType = typeof value;
      if (!["string", "number", "boolean"].includes(valueType) && value !== null) {
        errors.push(`${path}.${key} must be a string, number, boolean, or null.`);
      }
    });
  }

  function validateViewerState(viewerState, errors) {
    if (!isObject(viewerState)) {
      errors.push("viewerState must be an object.");
      return;
    }
    requireOnlyKeys(viewerState, ALLOWED_VIEWER_STATE_KEYS, "viewerState", errors);
    requireString(viewerState.visibleFilter, "viewerState.visibleFilter", errors);
    requireNullableString(viewerState.selectedAnnotationId, "viewerState.selectedAnnotationId", errors);
  }

  function validateAnnotations(annotations, errors) {
    if (!Array.isArray(annotations)) {
      errors.push("annotations must be an array.");
      return;
    }
    if (!annotations.length) {
      errors.push("annotations must include at least one review annotation.");
    }
    annotations.forEach((annotation, index) => {
      const path = `annotations[${index}]`;
      if (!isObject(annotation)) {
        errors.push(`${path} must be an object.`);
        return;
      }
      requireOnlyKeys(annotation, ALLOWED_ANNOTATION_KEYS, path, errors);
      requireString(annotation.id, `${path}.id`, errors);
      requireString(annotation.group, `${path}.group`, errors);
      requireString(annotation.type, `${path}.type`, errors);
      if (!ALLOWED_ANNOTATION_TYPES.has(annotation.type)) {
        errors.push(`${path}.type must be an existing prototype annotation type.`);
      }
      requireString(annotation.label, `${path}.label`, errors);
      requireString(annotation.color, `${path}.color`, errors);
      requireString(annotation.summary, `${path}.summary`, errors);
      validateRecord(annotation.values, `${path}.values`, errors);
      if (!isObject(annotation.draw)) {
        errors.push(`${path}.draw must be an object.`);
      }
      validateRecord(annotation.source, `${path}.source`, errors);
    });
  }

  function scanObject(value, path, errors) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => scanObject(item, `${path}[${index}]`, errors));
      return;
    }
    if (!isObject(value)) {
      if (typeof value === "string" && SECRET_VALUE_PATTERN.test(value)) {
        errors.push(`${path} must not include credentials, tokens, or secret query values.`);
      }
      return;
    }
    Object.entries(value).forEach(([key, child]) => {
      const normalized = normalizeFieldName(key);
      if (FORBIDDEN_FIELD_NAMES.has(normalized)) {
        errors.push(`${path}.${key} is outside the review-only artifact boundary.`);
      }
      if (SECRET_FIELD_PATTERN.test(key)) {
        errors.push(`${path}.${key} must not include credentials or secret material.`);
      }
      scanObject(child, `${path}.${key}`, errors);
    });
  }

  function requireOnlyKeys(record, allowedKeys, path, errors) {
    Object.keys(record).forEach((key) => {
      if (!allowedKeys.has(key)) {
        errors.push(`${path}.${key} is not part of review_artifact_v1.`);
      }
    });
  }

  function requireString(value, path, errors) {
    if (typeof value !== "string" || !value.trim()) {
      errors.push(`${path} must be a non-empty string.`);
    }
  }

  function requireNullableString(value, path, errors) {
    if (value !== null && typeof value !== "string") {
      errors.push(`${path} must be a string or null.`);
    }
  }

  function requireIsoString(value, path, errors) {
    requireString(value, path, errors);
    if (typeof value === "string" && Number.isNaN(Date.parse(value))) {
      errors.push(`${path} must be an ISO timestamp string.`);
    }
  }

  function requireNonNegativeInteger(value, path, errors) {
    if (!Number.isInteger(value) || value < 0) {
      errors.push(`${path} must be a non-negative integer.`);
    }
  }

  function validateStringArray(value, path, errors) {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array.`);
      return;
    }
    value.forEach((item, index) => {
      if (typeof item !== "string" || !item.trim()) {
        errors.push(`${path}[${index}] must be a non-empty string.`);
      }
    });
  }

  function normalizeFieldName(key) {
    return key.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  const api = {
    ARTIFACT_KIND,
    resolveReviewArtifactUrl,
    selectReviewArtifactSource,
    validateReviewArtifact,
    formatReviewArtifactErrors
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.ChartReviewArtifact = api;
  }
})();
