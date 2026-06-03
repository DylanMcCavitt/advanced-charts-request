const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  resolveReviewArtifactUrl,
  selectReviewArtifactSource,
  validateReviewArtifact
} = require("../review-artifact");

const repoRoot = path.join(__dirname, "..");
const currentHref = "https://chartreviewlab.company/prototype";
const staticArtifacts = {
  "nvda-daily": "/docs/fixtures/review_artifact_v1_nvda_daily.json",
  "spy-hourly": "/docs/fixtures/review_artifact_v1_spy_hourly.json"
};

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, "docs", "fixtures", name), "utf8"));
}

const validArtifact = loadFixture("review_artifact_v1_nvda_daily.json");
assert.equal(validateReviewArtifact(validArtifact).valid, true, "valid fixture should pass review_artifact_v1 validation");

const malformedArtifact = {
  kind: "review_artifact_v1",
  symbol: "NASDAQ:NVDA",
  recommendation: "buy"
};
assert.equal(validateReviewArtifact(malformedArtifact).valid, false, "malformed artifact should be rejected");

const unsupportedArtifact = {
  ...validArtifact,
  kind: "review_artifact_v2"
};
assert.equal(validateReviewArtifact(unsupportedArtifact).valid, false, "unsupported artifact kind should be rejected");

const fallbackRequest = selectReviewArtifactSource("", currentHref, staticArtifacts);
assert.deepEqual(fallbackRequest, { mode: "datafeed" }, "no artifact query should preserve normal datafeed mode");

const selectorRequest = selectReviewArtifactSource("?artifact=nvda-daily", currentHref, staticArtifacts);
assert.equal(selectorRequest.mode, "artifact");
assert.equal(selectorRequest.sourceType, "selector");
assert.equal(selectorRequest.url, "https://chartreviewlab.company/docs/fixtures/review_artifact_v1_nvda_daily.json");

const urlRequest = selectReviewArtifactSource(
  "?artifactUrl=/docs/fixtures/review_artifact_v1_spy_hourly.json",
  currentHref,
  staticArtifacts
);
assert.equal(urlRequest.mode, "artifact");
assert.equal(urlRequest.sourceType, "url");
assert.equal(urlRequest.url, "https://chartreviewlab.company/docs/fixtures/review_artifact_v1_spy_hourly.json");

const unsafeScriptUrl = resolveReviewArtifactUrl("javascript:alert(1)", currentHref);
assert.equal(unsafeScriptUrl.valid, false, "script URLs must be rejected");

const unsafeSecretUrl = resolveReviewArtifactUrl("/artifact.json?token=secret", currentHref);
assert.equal(unsafeSecretUrl.valid, false, "secret-bearing artifact URLs must be rejected");

const historyUrl = resolveReviewArtifactUrl(validArtifact.dataSource.historyUrl, currentHref);
assert.equal(historyUrl.valid, true, "fixture history URL should resolve as a safe public route");

console.log("prototype artifact loading checks passed");
