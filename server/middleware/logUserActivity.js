const express = require("express");
const app = express();

// Using Sentry to replace local file logging config
const Sentry = require("@sentry/node");
const { ProfilingIntegration } = require("@sentry/profiling-node");
require("dotenv").config();
const morgan = require("morgan");

Sentry.init({
  dsn: `${process.env.SENTRY_DSN}`,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Sentry.Integrations.Express({ app }),
    new ProfilingIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

// initializing to catch data w/ morgan middleware
let morganData = "";

const logUserActivity = async (data = { req, res }) => {
  const { req, res } = data;
  let dataToFile = "";
  let currPath = req.originalUrl;

  if (req.method !== "OPTIONS") {
    res.on("finish", async () => {
      console.log("the status code is: ", res.statusCode, req.method);

      let username = req.body ? req.body.username : null;
      let fname = req.params ? req.params.filename : null;
      const currDate = `${new Date().toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
      })}\n`;

      if (res.statusCode === 429) {
        dataToFile +=
          `${username ? username : "User"} exceeded rate limit at ${currDate}` +
          `\n`;
      }

      if (res.statusCode >= 200 && res.statusCode <= 399) {
        currPath = currPath === "/" ? "home" : currPath;
        dataToFile += `${currPath} path was visited at ${currDate} ${
          username ? "by " + username : ""
        }\n`;

        // add additional data to log if register path
        if (currPath === "/register") {
          dataToFile += `New user: ${username} has been added to DB at ${currDate}\n`;
        }

        // add additional data to log if login path
        if (currPath === "/login") {
          dataToFile += `${username} has logged in at ${currDate}`;
        }

        // add additional data to log if uploads path
        let total = 0;
        if (currPath === "/uploads") {
          for (const file of req.files) {
            total += file.size;
          }

          dataToFile +=
            `${username} uploaded ${req.files.length} files equaling ${total} KB` +
            `\n`;
        }

        if (currPath.includes("/all")) {
          let { username } = req.params;

          dataToFile += `${username} downloaded all their files at ${currDate}\n`;
        }

        if (currPath.includes("/profile") && currPath.includes(`/${fname}`)) {
          let { username } = req.params;
          dataToFile += `${username} downloaded a file at ${currDate}\n`;
        }

        if (currPath === "/profile" && req.method === "DELETE") {
          dataToFile += `${username} deleted a single file at ${currDate}`;
        }

        if (currPath.includes("deleteall")) {
          dataToFile += `${username} deleted all their files at ${currDate}`;
        }

        if (currPath === "/logout") {
          dataToFile += `User logged out at ${currDate}`;
        }

        // adding additional data to log during requests if exists
        if (morganData) {
          dataToFile += morganData + "\n";
          // reset to avoid duplicate & accumulating logs
          morganData = "";
        }

        Sentry.captureMessage(dataToFile);
      }
    });
  }
};

const morganLogger = morgan("combined", {
  skip: function (req, res) {
    return req.method === "OPTIONS";
  },
  stream: {
    write: (message) => {
      morganData += message;
    },
  },
});

module.exports = { Sentry, logUserActivity, morganLogger };
