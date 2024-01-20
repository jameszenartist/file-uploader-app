const express = require("express");
const app = express();
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const { logger } = require("./middleware/logEvents");
const { errorHandler } = require("./middleware/errorHandler");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const verifyJWT = require("./middleware/verifyJWT");

const { Sentry, morganLogger } = require("./middleware/logUserActivity");
const cookieParser = require("cookie-parser");
const credentials = require("./middleware/credentials");

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

// Apply rate limiting middleware globally

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  headers: true,
  validate: { xForwardedForHeader: false },

  handler: (req, res, next, options) => {
    return res
      .status(options.statusCode)
      .json({ error: `Rate limit exceeded. Please try again in 15 mins.` });
  },
});

require("dotenv").config();
const PORT = process.env.PORT || 4444;
app.use(compression({ level: -1, threshold: 10 * 1000 }));

app.use(helmet());
app.use(morganLogger);
app.use(logger);

//fetch cookies credentials requirement
app.use(credentials);
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// middleware for cookies
app.use(cookieParser());

app.use(limiter);
app.use("/", require("./routes/root"));
app.use("/register", require("./routes/register"));
app.use("/login", require("./routes/login"));
app.use("/logout", require("./routes/logout"));
app.use(verifyJWT);
app.use("/uploads", require("./routes/api/uploads"));
app.use("/refresh", require("./routes/refresh"));
app.use("/profile", require("./routes/api/profile"));

app.use(Sentry.Handlers.errorHandler());
// app.use(errorHandler);

app.listen(PORT, () => console.log(`listening on port ${PORT}...`));
