const limitCron = (req, res, next) => {
  if (req.headers["user-agent"] === "Cyclic-Cron") {
    next();
  } else {
    return res.status(403).json({ error: `Forbidden cron job request` });
  }
};

module.exports = { limitCron };
