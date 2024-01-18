const express = require("express");
const router = express.Router();
const multerController = require("../../controllers/multerController");
const multer = require("multer");
const { fileFilter } = require("../../config/multerOptions");

//storage engine tells multer how & where to store files

const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,

  limits: {
    fieldNameSize: 75,
    // 10MB limit
    fileSize: 10 * 1024 * 1024,
    // Allowing up to 5 files per request
    files: 5,
  },
  fileFilter: fileFilter,
});

//this route handles single or multiple files
router.post("/", upload.array("single_file", 5), multerController.uploadFiles);

module.exports = router;
