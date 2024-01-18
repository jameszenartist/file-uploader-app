const express = require("express");
const router = express.Router();
const multerController = require("../../controllers/multerController");

router.get("/all/:username", multerController.downloadAllFiles);
router.get("/:username/:filename", multerController.downloadFile);

router.post("/", multerController.getAllFiles);
router.delete("/", multerController.deleteFile);
router.delete("/deleteall", multerController.deleteAllFiles);

module.exports = router;
