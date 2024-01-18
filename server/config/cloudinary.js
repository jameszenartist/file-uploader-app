const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  secure: true,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteAllAssets = async () => {
  //fetching data for all files
  const data = await cloudinary.search
    .expression(`folder:storageApp/*`)
    .execute();

  if (data.resources.length === 0) return;

  const folders = [];
  const allFiles = [];
  // loop through all files to delete individually
  data?.resources.forEach((file) => {
    folders.push(file.folder);
    allFiles.push({
      public_id: `${file.public_id}`,
      resource_type: `${file.resource_type}`,
    });
  });

  //remove duplicates so can delete empty folders later
  const uniqueFolders = [...new Set(folders)];
  const promises = [];

  async function deleteFile(obj) {
    await cloudinary.uploader
      .destroy(`${obj.public_id}`, {
        resource_type: obj.resource_type,
        invalidate: true,
      })
      .catch((err) => {
        console.error(err);
        throw new Error(`Request to delete all cloudinary files failed`);
      });
  }

  // store all file delete fetches in promises
  allFiles.forEach(async (file) => {
    const promise = deleteFile(file);
    promises.push(promise);
  });

  // after all promises succeed, then delete empty folders
  Promise.all(promises)
    .then((results) => {
      //now deleting all remaining empty folders in storageApp folder
      uniqueFolders.forEach(async (folder) => {
        await cloudinary.api.delete_folder(`${folder}`).catch((err) => {
          throw err;
        });
      });
    })
    .catch((err) => {
      console.error(`Promise loop error: `, err);
      throw err;
    });

  console.log(`All files & folders in storageApp deleted.`);
};

module.exports = { cloudinary, deleteAllAssets };
