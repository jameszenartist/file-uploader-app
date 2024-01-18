const USER_REGEX = /^[A-z][A-z0-9-_]{5,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

const validateRegUser = (uname, email, pwd) => {
  if (
    !USER_REGEX.test(uname) ||
    !EMAIL_REGEX.test(email) ||
    !PWD_REGEX.test(pwd)
  )
    return false;
  return true;
};

module.exports = { validateRegUser };
