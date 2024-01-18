const { logEvents } = require("./logEvents");

const errorHandler = (err, req, res, next) => {
  console.log("Middleware Error Handling");
  const errStatus = err.statusCode || 500;
  const errMsg = err.message || "Something went wrong";
  const stack = process.env.NODE_ENV === "development" ? err.stack : {};
  // logEvents(`${err.name} ${err.message}`, "errLog.txt");
  console.error(errStatus, stack, errMsg);
  return res.sendStatus(errStatus);
};

module.exports = { errorHandler };
