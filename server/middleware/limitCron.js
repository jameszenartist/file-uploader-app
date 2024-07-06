const limitCron = (req, res, next) => {
  // if (req.headers["user-agent"] === "Cyclic-Cron") {
  //   next();
  // } else {
  //   return res.status(403).json({ error: `Forbidden cron job request` });
  // }

  if (req.headers["user-agent"]) {
    console.log(
      "cronjob middleware, user-agent is: ",
      req.headers["user-agent"]
    );
    next();
  } else {
    return res.status(403).json({ error: `Forbidden cron job request` });
  }
};

module.exports = { limitCron };
