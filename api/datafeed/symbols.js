const { SUPPORTED_RESOLUTIONS, knownSymbol, sendJson } = require("../_datafeed");

module.exports = function handler(req, res) {
  const symbol = knownSymbol(req.query.symbol);
  sendJson(req, res, 200, {
    name: symbol.full,
    ticker: symbol.full,
    full_name: symbol.full,
    description: symbol.description,
    exchange: symbol.exchange,
    listed_exchange: symbol.exchange,
    type: symbol.type,
    session: "0930-1600",
    timezone: "America/New_York",
    minmov: 1,
    pricescale: 100,
    has_intraday: true,
    has_daily: true,
    has_weekly_and_monthly: true,
    supported_resolutions: SUPPORTED_RESOLUTIONS,
    volume_precision: 0,
    data_status: "streaming"
  });
};
