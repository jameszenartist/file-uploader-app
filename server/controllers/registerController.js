const bcrypt = require("bcrypt");
const { getUser, addUser } = require("../pg/pool");
const { validateRegUser } = require("../utils/regex");
const { Sentry } = require("../middleware/logUserActivity");

//using async w/ bcrypt
const handleNewUser = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !password || !email)
    return res
      .status(400)
      .json({ error: "Username, Email, & password is required." });

  //validating form fields coming from client

  const regCheck = validateRegUser(username, email, password);
  if (!regCheck)
    return res
      .status(400)
      .json({ error: "Valid username, email, & password is required." });

  // check for duplicate usernames in DB
  // DB checks against new user being submitted

  const pgUserDuplicate = await getUser("username", username);

  //if true, then user is already registered

  if (pgUserDuplicate)
    return res.status(409).json({ error: `User already exists.` }); //conflict status

  try {
    //encrypt password
    // adds the salt rounds & hash all at once. 10 is default
    const hashedPwd = await bcrypt.hash(password, 10);

    // storing new user

    const pgAddedUser = await addUser(username, email, hashedPwd);

    if (!pgAddedUser)
      throw new Error(`Adding new user ${username} to pg DB has failed`);

    res.status(201).json({
      message: `New user ${username} created!`,
    });
  } catch (err) {
    Sentry.captureMessage(
      `Error: ${err.message} on 500 ${req.method} ${req.originalUrl}` + "\n\n"
    );
    res.status(500).json({ error: err.message });
  }
};
module.exports = { handleNewUser };
