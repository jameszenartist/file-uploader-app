const express = require("express");
const router = express.Router();
const crypto = require("crypto");
require("dotenv").config();

const verifyJWT = require("../middleware/verifyJWT");
const { getUser, clearTable, updateUserDBToken } = require("../pg/pool");

const { deleteAllAssets } = require("../config/cloudinary");
const mailService = require("../config/mailService");
const { Sentry } = require("../middleware/logUserActivity");

router.get("/about", (req, res) => {
  try {
    res.json({ data: `welcome to the About page.` });
  } catch (err) {
    console.log(err.message);
  }
});

router.get("/contact", (req, res) => {
  try {
    res.json({ data: `welcome to the Contact page.` });
  } catch (err) {
    console.log(err);
  }
});

router.post("/welcome", verifyJWT, async (req, res) => {
  const { username } = req.body;

  if (!username)
    return res.status(400).json({ error: `username needs to be included.` });

  try {
    // checking if client csrf token same as DB saved csrf
    const foundDBUser = await getUser("username", username);
    // grab potential csrf token from client

    let csrfToken = req.headers["csrf-token"];
    if (
      !csrfToken ||
      csrfToken === "" ||
      csrfToken !== foundDBUser.csrf_token
    ) {
      return res.status(403).json({ error: `csrf token check failed.` });
    }

    // create new csrf to send to postgres DB & client
    const newCSRF = crypto.randomUUID();

    //update postgres DB w/ new csrf
    const updatedUser = await updateUserDBToken(
      foundDBUser.username,
      foundDBUser.refresh_token,
      newCSRF
    );

    if (!updatedUser)
      throw new Error(
        `Updating ${foundDBUser.username} csrf token in DB has failed`
      );

    // new DB csrf successful, now sending new csrf to client

    return res
      .status(200)
      .json({ data: `welcome to the Welcome page.`, csrfToken: newCSRF });
  } catch (err) {
    console.log(err);
    Sentry.captureMessage(
      `Error: ${err.message} on ${res.statusCode} ${req.method} ${req.originalUrl}` +
        "\n\n"
    );
  }
});

const limitCron = (req, res, next) => {
  if (req.headers["user-agent"] === "Cyclic-Cron") {
    next();
  } else {
    res.status(403).json({ error: `Forbidden cron job request` });
  }
};

router.get("/deleteAllAssets", limitCron, async (req, res) => {
  try {
    let currDate = new Date().toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
    });
    console.log("current time: ", currDate);

    const result = await clearTable("user_files").then(async (res) => {
      let cloudRes = await deleteAllAssets()
        .then((res) => {
          console.log(`Delete all Cloudinary Assets Successful @ ${currDate}`);
          Sentry.captureMessage(
            `Delete all Cloudinary Assets Successful @ ${currDate}`
          );
        })
        .catch((err) => {
          console.log(err);
          throw new Error(`deleteAllAssets failed`);
        });
      return cloudRes;
    });
    return res.status(200).json({ data: `deleteAllAssets successful` });
  } catch (err) {
    console.log(err);
    Sentry.captureMessage(
      `Error: ${err.message} on ${res.statusCode} ${req.method} ${req.originalUrl}` +
        "\n\n"
    );
  }
});

router.get("/archiveIssues", limitCron, async (req, res) => {
  try {
    const allIssuesResult = await fetch(
      `https://sentry.io/api/0/projects/${process.env.SENTRY_ORG_SLUG}/${process.env.SENTRY_PROJ_SLUG}/issues/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SENTRY_API_TOKEN}`,
        },
      }
    )
      .then((res) => res.json())
      .catch((err) => {
        console.error(err);
        throw err;
      });

    if (!allIssuesResult.length)
      return res
        .status(500)
        .json({ error: `Sentry issues logs request failed` });

    console.log("resulting issues length: ", allIssuesResult.length);
    let dataToFile = "";

    //gather all necessary data from response
    allIssuesResult.forEach((issue) => {
      dataToFile += `${issue.title}\n`;
      dataToFile += `The culprit is:${issue.culprit}\n`;
      dataToFile += issue.metadata.value
        ? `${issue.metadata.value}\n\n`
        : "\n\n";
    });

    // take gathered data & write to file in memory

    // send file to own email w/ Nodemailer
    const emailResult = await mailService(dataToFile).catch((err) => {
      console.error(err);
      dataToFile = "";
      throw err;
    });
    //clear content after writing to file
    dataToFile = "";
    if (!emailResult)
      return res.status(500).json({ error: `Emailing Sentry logs failed` });

    // After successful email, then create func to delete all issues on Sentry

    const sentryClearResult = await fetch(
      `https://sentry.io/api/0/projects/${process.env.SENTRY_ORG_SLUG}/${process.env.SENTRY_PROJ_SLUG}/issues/`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SENTRY_DELETE_TOKEN}`,
        },
      }
    ).catch((err) => {
      console.error("Clearing Sentry logs error: ", err);
      throw err;
    });

    if (sentryClearResult.status !== 204) {
      const status = sentryClearResult.status || 500;
      return res
        .status(status)
        .json({ error: `Clearing Sentry issues logs failed` });
    }

    let currDate = new Date().toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
    });

    Sentry.captureMessage(
      `Archiving & clearing Sentry logs has been completed @ ${currDate}` +
        "\n\n"
    );

    return res.sendStatus(200);
  } catch (err) {
    console.log(err);
    Sentry.captureMessage(
      `Error: ${err.message} on ${res.statusCode} ${req.method} ${req.originalUrl}` +
        "\n\n"
    );
  }
});

module.exports = router;
