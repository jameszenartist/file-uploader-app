//domains that can access back-end data
//after development, should take out 127 & localhost
//this list will be allowed that cors won't prevent
const Origins = require("./origins");

const corsOptions = {
  origin: (origin, cb) => {
    console.log("Request origin:", origin);
    // if domain is in whitelist, or no origin/undefined (for development)
    if (Origins.indexOf(origin) !== -1) {
      //null is the error (no error), origin will be sent back & allowed
      cb(null, true);
    } else {
      cb(new Error("Not Allowed by CORS!"));
    }
  },
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
