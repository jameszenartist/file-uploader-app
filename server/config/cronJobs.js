const { CronJob } = require("cron");
const { deleteAllAssets } = require("./cloudinary");
const { clearTable } = require("../pg/pool");
const { Sentry } = require("../middleware/logUserActivity");

const ClearAssets = new CronJob(
  "0 */59 */23 * * *",
  async function () {
    console.log("clearing file data & all file assets everyday @ 11:59 PM");

    //clear all file data associated w/ cloudinary files
    // if postgres DB func successful, then delete clouidnary assets

    let currDate = new Date().toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
    });
    console.log("current time: ", currDate);

    const result = await clearTable("user_files");
    if (result) {
      await deleteAllAssets();

      console.log(`Delete all Cloudinary Assets Successful @ ${currDate}`);
      Sentry.captureMessage(
        `Delete all Cloudinary Assets Successful @ ${currDate}`
      );
    }
  },
  null,
  false,
  "America/Los_Angeles"
);

module.exports = { ClearAssets };
