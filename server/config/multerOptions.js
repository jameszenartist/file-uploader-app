const path = require("path");

// all file types that are not approved
// Use status code 415 Unsupported Media Type
// for unnacceptable file types
const blackListTypes = [
  ".zip",
  ".exe",
  ".msi",
  ".bat",
  ".cmd",
  ".sh",
  ".rar",
  ".tar",
  ".7z",
  ".docm",
  ".xlsm",
  ".pptm",
  ".db",
  ".sql",
  ".mdb",
  ".dll",
  ".sys",
  ".ini",
  ".log",
  ".htaccess",
  ".DS_Store",
  ".xxx",
  ".xyz",
];

// remember: file.size can't be accessed until
// the file has been received
const fileFilter = (req, file, cb) => {
  const extname = path.extname(file.originalname).toLowerCase();

  try {
    if (blackListTypes.indexOf(extname) !== -1) {
      return cb(new Error(`File type ${extname} not allowed!`));
    } else {
      cb(null, true);
    }
  } catch (err) {
    if (err.code === "LIMIT_FILE_SIZE") {
      console.error(err);
      return res.status(413).json({ message: `File too large.` });
    }
  }
};

module.exports = { fileFilter };
