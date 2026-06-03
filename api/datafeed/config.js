const { SUPPORTED_RESOLUTIONS, sendJson } = require("../_datafeed");

module.exports = function handler(req, res) {
  sendJson(req, res, 200, {
    supports_search: true,
    supports_group_request: false,
    supports_marks: false,
    supports_timescale_marks: false,
    supports_time: true,
    supported_resolutions: SUPPORTED_RESOLUTIONS
  });
};
