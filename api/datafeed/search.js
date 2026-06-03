const { searchKnownSymbols, sendJson } = require("../_datafeed");

module.exports = function handler(req, res) {
  const limit = Math.min(Math.max(Number(req.query.limit ?? 30), 1), 50);
  const matches = searchKnownSymbols(req.query.query, limit).map((symbol) => ({
    symbol: symbol.ticker,
    full_name: symbol.full,
    description: symbol.description,
    exchange: symbol.exchange,
    ticker: symbol.full,
    type: symbol.type
  }));

  sendJson(req, res, 200, matches);
};
