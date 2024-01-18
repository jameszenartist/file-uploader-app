const express = require("express");
const router = express.Router();
const registerController = require("../controllers/registerController");

const { body, validateFormFields } = require("../middleware/validate");

router.post(
  "/",
  validateFormFields([
    body("username").isString().isLength({ min: 6 }).escape(),
    body("email").isString().isEmail().escape(),
    body("password").isString().isLength({ min: 8 }).escape(),
  ]),
  registerController.handleNewUser
);

module.exports = router;
