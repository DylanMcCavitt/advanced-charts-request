const {
  alpacaCredentials,
  alpacaFeed,
  fetchAlpacaBars,
  resolutionToAlpacaTimeframe,
  sendJson
} = require("../_datafeed");

module.exports = async function handler(req, res) {
  const credentials = alpacaCredentials();
  const symbol = req.query.symbol ?? "NASDAQ:NVDA";
  const resolution = req.query.resolution ?? "D";
  const to = Math.floor(Date.now() / 1000);
  const from = to - 60 * 60 * 24 * 14;

  const base = {
    ok: false,
    kind: "alpaca_udf_datafeed_status",
    generatedAt: new Date().toISOString(),
    keyConfigured: credentials.configured,
    feed: alpacaFeed(),
    symbol,
    resolution,
    alpacaTimeframe: resolutionToAlpacaTimeframe(resolution),
    endpoints: {
      config: "/api/datafeed/config",
      search: "/api/datafeed/search?query=NVDA",
      symbols: "/api/datafeed/symbols?symbol=NASDAQ:NVDA",
      history: "/api/datafeed/history?symbol=NASDAQ:NVDA&resolution=D&from=0&to=9999999999",
      time: "/api/datafeed/time"
    }
  };

  if (!credentials.configured) {
    sendJson(req, res, 200, {
      ...base,
      message:
        "Set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY in Vercel to enable live Alpaca history responses."
    });
    return;
  }

  try {
    const result = await fetchAlpacaBars({ symbol, resolution, from, to });
    sendJson(req, res, 200, {
      ...base,
      ok: true,
      barCount: result.bars.length,
      latestBarTime: result.bars.at(-1)?.t ?? null
    });
  } catch (error) {
    sendJson(req, res, 200, {
      ...base,
      message: error.message
    });
  }
};
