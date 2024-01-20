const express = require("express");
const router = express.Router();
const crypto = require("crypto");
require("dotenv").config();

const verifyJWT = require("../middleware/verifyJWT");
const { getUser, updateUserDBToken } = require("../pg/pool");
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

module.exports = router;
