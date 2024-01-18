const express = require("express");
const router = express.Router();
const loginController = require("../controllers/loginController");

const { body, validateFormFields } = require("../middleware/validate");

router.post(
  "/",
  validateFormFields([
    body("username").isString().isLength({ min: 6 }).escape(),
    body("email").isString().isEmail().escape(),
    body("password").isString().isLength({ min: 8 }).escape(),
  ]),
  loginController.handleLogin
);

module.exports = router;
