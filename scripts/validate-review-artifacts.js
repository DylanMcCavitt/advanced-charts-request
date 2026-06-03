const fs = require("fs");
const path = require("path");
const { validateReviewArtifact, formatReviewArtifactErrors } = require("../review-artifact");

const fixtureDir = path.join(__dirname, "..", "docs", "fixtures");
const fixturePaths = fs
  .readdirSync(fixtureDir)
  .filter((name) => name.startsWith("review_artifact_v1_") && name.endsWith(".json"))
  .map((name) => path.join(fixtureDir, name));

let failed = false;

fixturePaths.forEach((fixturePath) => {
  const payload = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const result = validateReviewArtifact(payload);
  if (!result.valid) {
    failed = true;
    console.error(`${path.relative(process.cwd(), fixturePath)} failed validation:`);
    console.error(formatReviewArtifactErrors(result.errors));
  }
});

const boundaryResult = validateReviewArtifact({
  kind: "review_artifact_v1",
  symbol: "NASDAQ:NVDA",
  resolution: "D",
  timeframe: "Daily",
  dataSource: {
    provider: "alpaca",
    feed: "sip",
    baseUrl: "/api/datafeed",
    historyUrl: "/api/datafeed/history?symbol=NASDAQ:NVDA"
  },
  candleSource: {
    mode: "server_datafeed",
    bars: 1,
    windowStart: "2026-06-02 09:30",
    windowEnd: "2026-06-02 16:00",
    latestBarTime: "2026-06-02 16:00",
    stale: false
  },
  generatedAt: "2026-06-03T16:00:00.000Z",
  sourceMetadata: {
    route: "/prototype"
  },
  caveats: ["Boundary test artifact."],
  viewerState: {
    visibleFilter: "all",
    selectedAnnotationId: "bad-field"
  },
  annotations: [
    {
      id: "bad-field",
      group: "levels",
      type: "horizontal_level",
      label: "Bad field",
      color: "#0f766e",
      summary: "Boundary test.",
      values: {
        score: 1
      },
      draw: {
        price: 1
      },
      source: {
        route: "/prototype"
      }
    }
  ]
});

if (boundaryResult.valid) {
  failed = true;
  console.error("Boundary validation failed to reject a non-review field.");
}

if (failed) {
  process.exit(1);
}

console.log(`validated ${fixturePaths.length} review_artifact_v1 fixture(s)`);
