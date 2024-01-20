require("dotenv").config();
const { deleteAllAssets } = require("./cloudinary");
const { checkForRowData, clearTable } = require("../pg/pool");
const mailService = require("../config/mailService");
const { Sentry } = require("../middleware/logUserActivity");

const clearAllAssets = async (req, res) => {
  try {
    const rowData = await checkForRowData("user_files").catch((err) => {
      console.log(err);
      throw err;
    });
    if (rowData.count === "0") return res.sendStatus(204);
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
};

const archiveIssues = async (req, res) => {
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
};

module.exports = { clearAllAssets, archiveIssues };
