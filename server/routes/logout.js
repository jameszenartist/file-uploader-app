const express = require("express");
const router = express.Router();
const logoutController = require("../controllers/logoutController");

// routing for logout
router.get("/", logoutController.handleLogout);

module.exports = router;
