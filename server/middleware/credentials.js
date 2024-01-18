const Origins = require("../config/origins");

const credentials = (req, res, next) => {
  const origin = req.headers.origin;
  //if origin is in approved list
  if (Origins.includes(origin)) {
    res.header("Access-Control-Allow-Credentials", true);
  }
  next();
};

module.exports = credentials;
