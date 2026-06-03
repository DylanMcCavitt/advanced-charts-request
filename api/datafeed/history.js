const { barsToUdfHistory, fetchAlpacaBars, sendJson } = require("../_datafeed");

module.exports = async function handler(req, res) {
  try {
    const result = await fetchAlpacaBars({
      symbol: req.query.symbol,
      resolution: req.query.resolution,
      from: req.query.from,
      to: req.query.to
    });
    sendJson(req, res, 200, barsToUdfHistory(result.bars));
  } catch (error) {
    sendJson(req, res, error.statusCode ?? 500, {
      s: "error",
      errmsg: error.message
    });
  }
};
