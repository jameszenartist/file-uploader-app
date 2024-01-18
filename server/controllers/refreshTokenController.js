//For refresh token route

const fsPromises = require("fs").promises;
const path = require("path");

//required for JWT implementation
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { getUser, updateUserDBToken } = require("../pg/pool");

//doesn't need to be async
const handleRefreshToken = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);

  //Now that we know the cookie exists from frontend
  // jwt here is the property name
  const refreshToken = cookies.jwt;

  //checking DB if logged in earlier & refreshToken exists
  //while comparing refreshToken on frontend

  const foundDBUser = await getUser("refresh_token", refreshToken);

  //is refreshToken in DB?
  //if false, user needs to login

  if (!foundDBUser) return res.sendStatus(403); // Forbidden

  try {
    let accessToken;

    //evaluate JWT
    //comparing refreshToken on frontend w/ one on backend
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        //if error or if username on frontend has been tampered with

        if (err || foundDBUser.username !== decoded.username)
          return res.sendStatus(403);

        //creating new access token to be sent to frontend
        accessToken = jwt.sign(
          {
            UserInfo: {
              username: decoded.username,
            },
          },
          process.env.ACCESS_TOKEN_SECRET,
          // 30 sec. for dev purposes(should be 5-15 mins)
          { expiresIn: 5 * 60 }
        );
      }
    );

    // delete old refreshToken to be rotated

    //create new refreshToken

    const newRefreshToken = jwt.sign(
      { username: foundDBUser.username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: 10 * 60 }
    );

    // update foundDBUser's blank refreshToken w/
    // newly rotating refreshToken

    // saving newly rotated refresh token in DB w/ current user

    const updatedUser = await updateUserDBToken(
      foundDBUser.username,
      newRefreshToken,
      foundDBUser.csrf_token
    );

    if (!updatedUser)
      throw new Error(
        `Updating ${foundDBUser.username} refresh token in DB has failed`
      );

    // sending new refresh token to client to
    // update/overwrite/rotate used, old invalid refreshtoken
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      sameSite: "None",
      //secure: true expects https
      secure: true,
      //max age = 10 mins
      maxAge: 1 * 10 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (error) {
    console.error("Error during token rotation:", error.message);
    res.status(500).json({ error: "Token rotation failed" });
  }
};

module.exports = { handleRefreshToken };
