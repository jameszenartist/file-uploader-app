const bcrypt = require("bcrypt");
const crypto = require("crypto");

//required for JWT implementation
const jwt = require("jsonwebtoken");
require("dotenv").config();
// need this bc still have not yet integrated any DB tech
const fsPromises = require("fs").promises;

const { USER_STORAGE_LIMIT, getUser, userLogin } = require("../pg/pool");

// logic for after user is registered & created

const handleLogin = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !password || !email)
    return res
      .status(400)
      .json({ error: "Username, Email, & Password is required." });

  //check to see if user exists

  const foundDBUser = await getUser("username", username);

  //if false, user needs to register first

  if (
    !foundDBUser ||
    !foundDBUser.username ||
    !foundDBUser.password ||
    !foundDBUser.email
  ) {
    return res.status(401).json({ error: "Need to register first!" }); // Unauthorized
  }

  //evaluate password

  const match = await bcrypt.compare(password, foundDBUser.password);

  if (match) {
    //Now creating JWTs
    // (access & refresh token) & sent to browser
    const accessToken = jwt.sign(
      // passing in payload (username obj)
      //found user from earlier
      {
        // private jwt claim
        UserInfo: {
          username: foundDBUser.username,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      // Options value
      // 30 sec. for dev should be 5 to 15 mins
      { expiresIn: 5 * 60 }
    );

    //Refresh token:
    const refreshToken = jwt.sign(
      { username: foundDBUser.username },
      process.env.REFRESH_TOKEN_SECRET,
      // refresh token here 10 mins
      { expiresIn: 10 * 60 }
    );

    //Now saving refresh token in DB w/ current user

    // update user DB token w/ foundDBUser data from earlier

    // creating csrf token:
    let csrfToken = crypto.randomUUID();

    const updatedDBUser = await userLogin(
      foundDBUser.username,
      refreshToken,
      csrfToken
    );

    if (!updatedDBUser)
      return res.status(500).json({ error: `Login server update failed.` });

    //Now sending token (non-accessible) to browser/memory
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      //secure: true expects https
      secure: true,
      //max age = 10 mins
      maxAge: 1 * 10 * 60 * 1000,
    });
    // short lived access token (accessible) to client
    res.json({
      accessToken,
      username: foundDBUser.username,
      csrfToken: csrfToken,
    });
  } else {
    //pwd did not match, therefore unauthorized
    return res.status(401).json({ error: `Login attempt failed!` });
  }
};

module.exports = { handleLogin };
