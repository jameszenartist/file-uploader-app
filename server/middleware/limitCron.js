const limitCron = (req, res, next) => {
  // if (req.headers["user-agent"] === "Cyclic-Cron") {
  //   next();
  // } else {
  //   return res.status(403).json({ error: `Forbidden cron job request` });
  // }

  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    if (token === process.env.FILE_APP_UPLOADER_MIDDLEWARE_TOKEN) {
      return next();
    }

    next();
  } else {
    return res.status(403).json({ error: `Forbidden cron job request` });
  }
};

module.exports = { limitCron };
