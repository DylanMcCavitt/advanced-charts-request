const { sendText } = require("../_datafeed");

module.exports = function handler(req, res) {
  sendText(req, res, 200, String(Math.floor(Date.now() / 1000)));
};
