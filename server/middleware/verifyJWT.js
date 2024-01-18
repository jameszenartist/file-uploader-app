const jwt = require("jsonwebtoken");
require("dotenv").config();

//used for after login success
const verifyJWT = (req, res, next) => {
  //modified auth header for specificity
  const authHeader = req.headers.authorization || req.headers.Authorization;
  //modified conditonal for specificity

  if (!authHeader?.startsWith("Bearer ") || !authHeader)
    return res.status(401).json({ error: `Access token check failed.` });

  //define token
  const token = authHeader.split(" ")[1];
  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    // decoded/token: decoded info from JWT
    (err, decoded) => {
      //here, token was received, but might
      // have been tampered with
      if (err) return res.sendStatus(403); //forbidden/invalid token

      //username bc originally passed in
      //stored in req obj for use w/ later requests
      req.username = decoded.UserInfo.username;

      next();
    }
  );
};

module.exports = verifyJWT;
