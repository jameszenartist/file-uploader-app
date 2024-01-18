// For erasing refreshToken if user chooses to logout

const { getUser, updateUserDBToken } = require("../pg/pool");

const handleLogout = async (req, res) => {
  //On client, also delete access token
  //while on backend, can't delete token on frontend
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //no content

  //Now that we know the cookie exists from frontend
  const refreshToken = cookies.jwt;

  //is refreshToken in DB?

  const foundDBUser = await getUser("refresh_token", refreshToken);

  //no found user in DB but have cookie on client:

  if (!foundDBUser) {
    //when clearing, have to set it exactly
    //as before during authentication
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "None",
      //secure: true expects https
      secure: true,
      //max age = 10 mins
      maxAge: 1 * 10 * 60 * 1000,
    });
    //sending status successful but no content
    return res.sendStatus(204);
  }

  //at this point means we did find same refresh token in DB
  //delete refresh token in DB

  // update user in DB w/ no refresh token & no csrfToken
  const updatedUser = await updateUserDBToken(foundDBUser.username, "", "");

  //when clearing, have to set it exactly
  //as before during authentication
  res.clearCookie("jwt", {
    httpOnly: true,
    //set to prevent from being blocked due
    //to cross site response (frontend domain different than backend domain)
    sameSite: "None",
    secure: true,
    //max age = 10 mins
    maxAge: 1 * 10 * 60 * 1000,
  });

  return res.sendStatus(204);
};

module.exports = { handleLogout };
