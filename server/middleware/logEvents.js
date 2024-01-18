const crypto = require("crypto");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const { logUserActivity } = require("../middleware/logUserActivity");

const logEvents = async (message, logName) => {
  const dateTime = `${new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
  })}`;

  const logItem = `${dateTime}\t${crypto.randomUUID()}\t${message}\n`;

  try {
    //checking if logs folder exists
    if (!fs.existsSync(path.join(__dirname, "..", "logs"))) {
      //if not, creating logs folder
      await fsPromises.mkdir(path.join(__dirname, "..", "logs"));
    }

    //here logs folder exists & attaching data to file
    await fsPromises.appendFile(
      path.join(__dirname, "..", "logs", logName),
      logItem
    );
  } catch (err) {
    console.log(err);
  }
};

//middleware to handle logging events
const logger = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  logUserActivity({ req, res });
  next();
};

module.exports = { logEvents, logger };
