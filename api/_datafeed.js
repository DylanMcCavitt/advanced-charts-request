const SUPPORTED_RESOLUTIONS = ["1", "5", "15", "30", "60", "D", "W", "M"];

const KNOWN_SYMBOLS = [
  ["NASDAQ:NVDA", "NVDA", "NVIDIA Corporation", "NASDAQ"],
  ["NASDAQ:AMD", "AMD", "Advanced Micro Devices, Inc.", "NASDAQ"],
  ["NASDAQ:MU", "MU", "Micron Technology, Inc.", "NASDAQ"],
  ["NASDAQ:AAPL", "AAPL", "Apple Inc.", "NASDAQ"],
  ["NASDAQ:MSFT", "MSFT", "Microsoft Corporation", "NASDAQ"],
  ["NASDAQ:AMZN", "AMZN", "Amazon.com, Inc.", "NASDAQ"],
  ["NASDAQ:GOOGL", "GOOGL", "Alphabet Inc.", "NASDAQ"],
  ["NASDAQ:META", "META", "Meta Platforms, Inc.", "NASDAQ"],
  ["NASDAQ:TSLA", "TSLA", "Tesla, Inc.", "NASDAQ"],
  ["NYSE:SPY", "SPY", "SPDR S&P 500 ETF Trust", "NYSE"],
  ["NASDAQ:QQQ", "QQQ", "Invesco QQQ Trust", "NASDAQ"]
].map(([full, ticker, description, exchange]) => ({
  full,
  ticker,
  description,
  exchange,
  type: "stock"
}));

function applyCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(req, res, statusCode, payload) {
  applyCors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function sendText(req, res, statusCode, text) {
  applyCors(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(text);
}

function alpacaCredentials() {
  const keyId =
    process.env.ALPACA_API_KEY_ID ??
    process.env.APCA_API_KEY_ID ??
    process.env.ALPACA_KEY_ID;
  const secretKey =
    process.env.ALPACA_API_SECRET_KEY ??
    process.env.APCA_API_SECRET_KEY ??
    process.env.ALPACA_SECRET_KEY;

  return {
    keyId,
    secretKey,
    configured: Boolean(keyId && secretKey)
  };
}

function alpacaFeed() {
  return (process.env.ALPACA_DATA_FEED ?? process.env.APCA_DATA_FEED ?? "sip").toLowerCase();
}

function parseSymbol(input) {
  const raw = String(input ?? "NASDAQ:NVDA").trim().toUpperCase();
  const [maybeExchange, maybeTicker] = raw.includes(":")
    ? raw.split(":", 2)
    : ["NASDAQ", raw];
  const ticker = (maybeTicker || raw).replace(/[^A-Z0-9.]/g, "");
  const exchange = (maybeExchange || "NASDAQ").replace(/[^A-Z0-9.]/g, "");

  return {
    exchange,
    ticker,
    full: `${exchange}:${ticker}`
  };
}

function knownSymbol(symbolInput) {
  const parsed = parseSymbol(symbolInput);
  return (
    KNOWN_SYMBOLS.find(
      (symbol) => symbol.full === parsed.full || symbol.ticker === parsed.ticker
    ) ?? {
      full: parsed.full,
      ticker: parsed.ticker,
      description: `${parsed.ticker} stock`,
      exchange: parsed.exchange,
      type: "stock"
    }
  );
}

function searchKnownSymbols(query, limit) {
  const needle = String(query ?? "").trim().toUpperCase();
  const matches = KNOWN_SYMBOLS.filter(
    (symbol) =>
      !needle ||
      symbol.full.includes(needle) ||
      symbol.ticker.includes(needle) ||
      symbol.description.toUpperCase().includes(needle)
  );
  return matches.slice(0, limit);
}

function resolutionToAlpacaTimeframe(resolution) {
  const normalized = String(resolution ?? "D").toUpperCase();
  const map = {
    "1": "1Min",
    "5": "5Min",
    "15": "15Min",
    "30": "30Min",
    "60": "1Hour",
    D: "1Day",
    "1D": "1Day",
    W: "1Week",
    "1W": "1Week",
    M: "1Month",
    "1M": "1Month"
  };
  return map[normalized] ?? "1Day";
}

function isoFromUnixSeconds(value, fallback) {
  const number = Number(value);
  const seconds = Number.isFinite(number) && number > 0 ? number : fallback;
  return new Date(seconds * 1000).toISOString();
}

async function fetchAlpacaBars({ symbol, resolution, from, to }) {
  const credentials = alpacaCredentials();
  if (!credentials.configured) {
    const error = new Error(
      "Alpaca API keys are not configured. Set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY in Vercel."
    );
    error.statusCode = 503;
    throw error;
  }

  const parsed = parseSymbol(symbol);
  const timeframe = resolutionToAlpacaTimeframe(resolution);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const defaultFrom = nowSeconds - 60 * 60 * 24 * 30;
  const params = new URLSearchParams({
    symbols: parsed.ticker,
    timeframe,
    start: isoFromUnixSeconds(from, defaultFrom),
    end: isoFromUnixSeconds(to, nowSeconds),
    adjustment: "raw",
    feed: alpacaFeed(),
    sort: "asc",
    limit: "10000"
  });

  const response = await fetch(`https://data.alpaca.markets/v2/stocks/bars?${params}`, {
    headers: {
      "APCA-API-KEY-ID": credentials.keyId,
      "APCA-API-SECRET-KEY": credentials.secretKey
    }
  });

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(
      payload?.message ?? payload?.error ?? `Alpaca request failed with ${response.status}.`
    );
    error.statusCode = response.status;
    error.payload = payload;
    throw error;
  }

  const bars = Array.isArray(payload?.bars?.[parsed.ticker])
    ? payload.bars[parsed.ticker]
    : Array.isArray(payload?.bars)
      ? payload.bars
      : [];

  return {
    symbol: parsed,
    timeframe,
    feed: alpacaFeed(),
    bars
  };
}

function barsToUdfHistory(bars) {
  if (!bars.length) {
    return { s: "no_data" };
  }

  return {
    s: "ok",
    t: bars.map((bar) => Math.floor(new Date(bar.t).getTime() / 1000)),
    o: bars.map((bar) => Number(bar.o)),
    h: bars.map((bar) => Number(bar.h)),
    l: bars.map((bar) => Number(bar.l)),
    c: bars.map((bar) => Number(bar.c)),
    v: bars.map((bar) => Number(bar.v ?? 0))
  };
}

module.exports = {
  KNOWN_SYMBOLS,
  SUPPORTED_RESOLUTIONS,
  alpacaCredentials,
  alpacaFeed,
  barsToUdfHistory,
  fetchAlpacaBars,
  knownSymbol,
  parseSymbol,
  resolutionToAlpacaTimeframe,
  searchKnownSymbols,
  sendJson,
  sendText
};
