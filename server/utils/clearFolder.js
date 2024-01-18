const fs = require("fs");
const path = require("path");

const clearFolder = (folder) => {
  // loop thru all files in uploads folder to delete
  fs.readdir(folder, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(folder, file), (err) => {
        if (err) throw err;
      });
    }
    console.log(`${folder.split("/").pop()} has been cleared!`);
  });
};

module.exports = { clearFolder };
