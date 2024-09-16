const limitCron = (req, res, next) => {
  // if (req.headers["user-agent"] === "Cyclic-Cron") {
  //   next();
  // } else {
  //   return res.status(403).json({ error: `Forbidden cron job request` });
  // }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader)
    return res.status(403).json({ error: `Forbidden cron job request` });

  const token = authHeader.split(" ")[1];

  //if g-hub project secret token is the same from
  // the g-hub action then middleware should pass
  if (token === process.env.FILE_APP_UPLOADER_MIDDLEWARE_TOKEN) {
    return next();
  } else {
    return res.status(403).json({ error: `Forbidden cron job request` });
  }
};

module.exports = { limitCron };
