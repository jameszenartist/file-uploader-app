const crypto = require("crypto");
const { clearFolder } = require("../utils/clearFolder");
const { cloudinary } = require("../config/cloudinary");
const { Sentry } = require("../middleware/logUserActivity");

const {
  USER_STORAGE_LIMIT,
  getUser,
  getCurrentStorageAmt,
  addFile,
  updateDownloadFileTime,
  updateDownloadTimes,
  deleteDBFiles,
  updateUserDBToken,
} = require("../pg/pool");

// GET handlers
const downloadFile = async (req, res) => {
  const { username, filename } = req.params;

  if (!username || !filename)
    return res
      .status(400)
      .json({ error: `username & filename needs to be included.` });

  // checking if client csrf token same as DB saved csrf
  const foundDBUser = await getUser("username", username);
  // grab potential csrf token from client

  let csrfToken = req.headers["csrf-token"];
  if (!csrfToken || csrfToken === "" || csrfToken !== foundDBUser.csrf_token) {
    return res.status(403).json({ error: `csrf token check failed.` });
  }

  try {
    const downloadFileCount = await updateDownloadFileTime(username, filename);

    if (!downloadFileCount || downloadFileCount === 0)
      return res
        .status(500)
        .json({ error: `Updating file download data failed.` });

    // create new csrf to send to postgres DB & client
    const newCSRF = crypto.randomUUID();

    //update postgres DB w/ new csrf
    const updatedUser = await updateUserDBToken(
      foundDBUser.username,
      foundDBUser.refresh_token,
      newCSRF
    );

    if (!updatedUser)
      throw new Error(
        `Updating ${foundDBUser.username} csrf token in DB has failed`
      );

    // new DB csrf successful, now sending new csrf to client
    return res
      .status(200)
      .json({ data: `${filename} download successful`, csrfToken: newCSRF });
  } catch (err) {
    console.error(err.message);
    Sentry.captureMessage(
      `Error: ${err.message} on 400 ${req.method} ${req.originalUrl}` + "\n\n"
    );
    return res.status(400).json({ error: err.message });
  }
};

const downloadAllFiles = async (req, res) => {
  const { username } = req.params;

  if (!username)
    return res.status(400).json({ error: `username was not included.` });

  // checking if client csrf token same as DB saved csrf
  const foundDBUser = await getUser("username", username);
  // grab potential csrf token from client

  let csrfToken = req.headers["csrf-token"];
  if (!csrfToken || csrfToken === "" || csrfToken !== foundDBUser.csrf_token) {
    return res.status(403).json({ error: `csrf token check failed.` });
  }

  try {
    //downloading all files associated w/ user

    // here all files to be downloaded exist
    // here creating zip folder link to download all files on client

    const data = await cloudinary.utils.download_folder(
      `storageApp/${username}`,
      {
        target_public_id: `${username}`,
      }
    );

    if (!data)
      return res
        .status(500)
        .json({ error: `Cloudinary zip folder download failed.` });

    const downloadFileCount = await updateDownloadTimes(username);

    if (!downloadFileCount || downloadFileCount === 0)
      return res
        .status(500)
        .json({ error: `Updating file download data failed.` });

    // create new csrf to send to postgres DB & client
    const newCSRF = crypto.randomUUID();

    //update postgres DB w/ new csrf
    const updatedUser = await updateUserDBToken(
      foundDBUser.username,
      foundDBUser.refresh_token,
      newCSRF
    );

    if (!updatedUser)
      throw new Error(
        `Updating ${foundDBUser.username} csrf token in DB has failed`
      );

    // new DB csrf successful, now sending new csrf to client

    return res.status(200).json({ data: data, csrfToken: newCSRF });
  } catch (err) {
    console.error(err.message);
    Sentry.captureMessage(
      `Error: ${err.message} on 400 ${req.method} ${req.originalUrl}` + "\n\n"
    );
    return res.status(400).json({ error: err.message });
  }
};

// POST handlers

const uploadFiles = async (req, res) => {
  if (!req.files) return res.status(400).send("File uploads failed.");
  if (req.files.length > 5) return res.sendStatus(400);

  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "username is required" });

  // checking if client csrf token same as DB saved csrf
  const foundDBUser = await getUser("username", username);
  // grab potential csrf token from client

  let csrfToken = req.headers["csrf-token"];
  if (!csrfToken || csrfToken === "" || csrfToken !== foundDBUser.csrf_token) {
    return res.status(403).json({ error: `csrf token check failed.` });
  }

  const options = {
    use_filename: true,
    unique_filename: false,
    overwrite: true,
    // type: "authenticated",
    tags: [`${username}`],
    resource_type: "auto",
    folder: `storageApp/${username}`,
    headers: req.header["authorization"],
  };

  // file links to send back to client
  let links = [];
  let uploadTotal = 0;
  try {
    // adding new files to JSON DB

    const newFiles = [];
    const currFilesTotal = await getCurrentStorageAmt(username);
    let filename;
    for (const file of req.files) {
      const timestamp = Date.now();
      filename = `${timestamp}-${file.originalname
        .replace(" ", "-")
        .replace(/[&\/\\#,+()$~%'":*?<>{}]/g, "-")}`;
      if (filename.length > 255) {
        throw new Error("File name is too long");
      }
      uploadTotal += file.size;
      newFiles.push({
        ...file,
        username: username,
        filename: filename,
        uploadTime: new Date().toLocaleString("en-US", {
          timeZone: "America/Los_Angeles",
        }),
      });
    }

    if (parseInt(currFilesTotal) + uploadTotal >= USER_STORAGE_LIMIT)
      return res.status(413).json({
        error: `File upload failed due to exceeding user storage limit.`,
      });

    for (const file of newFiles) {
      let data = await new Promise((resolve) => {
        cloudinary.uploader
          .upload_stream(
            { ...options, filename: file.filename },
            (err, result) => {
              if (err) throw new Error(`Cloudinary error: ${err}`);
              return resolve(result);
            }
          )
          .end(file.buffer);
      });

      links.push(data.secure_url);
      const newFile = await addFile(username, file);
      if (!newFile)
        return res
          .status(500)
          .json({ error: `Adding ${file.filename} data to DB failed.` });
    }

    if (links.length === 0)
      return res
        .status(500)
        .json({ error: `Cloudinary failed to return links` });

    // create new csrf to send to postgres DB & client
    const newCSRF = crypto.randomUUID();

    //update postgres DB w/ new csrf
    const updatedUser = await updateUserDBToken(
      foundDBUser.username,
      foundDBUser.refresh_token,
      newCSRF
    );

    if (!updatedUser)
      throw new Error(
        `Updating ${foundDBUser.username} csrf token in DB has failed`
      );

    // new DB csrf successful, now sending new csrf to client

    return res.status(201).json({
      message: "File Uploading Successful!",
      data: links,
      csrfToken: newCSRF,
    });
  } catch (err) {
    console.error(err);
    Sentry.captureMessage(
      `Error: ${err.message} on 400 ${req.method} ${req.originalUrl}` + "\n\n"
    );
    return res.status(400).json({ error: err.message });
  }
};

const getAllFiles = async (req, res) => {
  if (!req.body) return res.sendStatus(400);

  try {
    const { username } = req.body;
    if (!username)
      return res.status(401).json({ error: `username not found.` });

    // checking if client csrf token same as DB saved csrf
    const foundDBUser = await getUser("username", username);
    // grab potential csrf token from client

    let csrfToken = req.headers["csrf-token"];
    if (
      !csrfToken ||
      csrfToken === "" ||
      csrfToken !== foundDBUser.csrf_token
    ) {
      return res.status(403).json({ error: `csrf token check failed.` });
    }

    // fetching all user files data from cloudinary
    const result = await cloudinary.search
      .expression(`folder:storageApp/${username}`)
      .execute();

    const data = result?.resources.map((file) => {
      return {
        filename: `${file.secure_url.split("/").pop()}`,
        size: file.bytes,
        format: file.format,
        secure_url: file.secure_url,
        public_id: file.public_id,
        resource_type: file.resource_type,
      };
    });

    // create new csrf to send to postgres DB & client
    const newCSRF = crypto.randomUUID();

    //update postgres DB w/ new csrf
    const updatedUser = await updateUserDBToken(
      foundDBUser.username,
      foundDBUser.refresh_token,
      newCSRF
    );

    if (!updatedUser)
      throw new Error(
        `Updating ${foundDBUser.username} csrf token in DB has failed`
      );

    // new DB csrf successful, now sending new csrf to client

    res.status(200).json({ data, csrfToken: newCSRF });
  } catch (err) {
    console.error(err);
    Sentry.captureMessage(
      `Error: ${err.message} on 400 ${req.method} ${req.originalUrl}` + "\n\n"
    );
    res.status(400).json({ error: err.message });
  }
};

// DELETE handlers

const deleteFile = async (req, res) => {
  if (!req.body) return res.sendStatus(400);

  try {
    const { filename, username, public_id, resource_type } = req.body;

    // checking if client csrf token same as DB saved csrf
    const foundDBUser = await getUser("username", username);
    // grab potential csrf token from client

    let csrfToken = req.headers["csrf-token"];
    if (
      !csrfToken ||
      csrfToken === "" ||
      csrfToken !== foundDBUser.csrf_token
    ) {
      return res.status(403).json({ error: `csrf token check failed.` });
    }

    if (!public_id)
      return res.status(500).json({ error: `public_id needed to delete file` });
    if (!filename || !username)
      return res.status(401).json({
        error: !filename
          ? `file requested to be deleted not found.`
          : `username requesting file to be deleted not found.`,
      });

    const deletedFile = await deleteDBFiles(username, filename);

    if (!deletedFile)
      return res
        .status(500)
        .json({ error: `file data to be deleted not found.` });

    const data = await cloudinary.uploader.destroy(`${public_id}`, {
      resource_type: resource_type,
    });

    console.log("deleted file result: ", data);

    if (!data || data.result === "not found")
      return res
        .status(500)
        .json({ error: `Attempt to delete ${filename} has failed.` });

    // create new csrf to send to postgres DB & client
    const newCSRF = crypto.randomUUID();

    //update postgres DB w/ new csrf
    const updatedUser = await updateUserDBToken(
      foundDBUser.username,
      foundDBUser.refresh_token,
      newCSRF
    );

    if (!updatedUser)
      throw new Error(
        `Updating ${foundDBUser.username} csrf token in DB has failed`
      );

    // new DB csrf successful, now sending new csrf to client

    res
      .status(200)
      .json({ message: `File: ${filename} was deleted.`, csrfToken: newCSRF });
  } catch (err) {
    console.error(err);
    Sentry.captureMessage(
      `Error: ${err.message} on 400 ${req.method} ${req.originalUrl}` + "\n\n"
    );
    res.status(400).json({ error: err.message });
  }
};

const deleteAllFiles = async (req, res) => {
  if (!req.body) return res.sendStatus(400);

  try {
    const { username } = req.body;
    if (!username)
      return res.status(401).json({
        error: `username requesting all files to be deleted was not found.`,
      });

    // checking if client csrf token same as DB saved csrf
    const foundDBUser = await getUser("username", username);
    // grab potential csrf token from client

    let csrfToken = req.headers["csrf-token"];
    if (
      !csrfToken ||
      csrfToken === "" ||
      csrfToken !== foundDBUser.csrf_token
    ) {
      return res.status(403).json({ error: `csrf token check failed.` });
    }

    const allDeletedFiles = await deleteDBFiles(username);

    if (!allDeletedFiles)
      return res
        .status(500)
        .json({ error: `All file data to be deleted not found.` });

    //fetching data for all files
    const data = await cloudinary.search
      .expression(`folder:storageApp/${username}`)
      .execute();

    async function deleteFile(obj) {
      await cloudinary.uploader
        .destroy(`${obj.public_id}`, {
          resource_type: obj.resource_type,
          invalidate: true,
        })
        .catch((err) => {
          console.error(err);
          throw new Error(`Request to delete all ${username} files failed`);
        });
    }

    const promises = [];
    // loop through all files to delete individually
    data?.resources.forEach((file) => {
      const promise = deleteFile(file);
      promises.push(promise);
    });

    Promise.all(promises)
      .then(async (results) => {
        //now deleting remaining empty folder
        await cloudinary.api
          .delete_folder(`storageApp/${username}`)
          .catch((err) => {
            throw err;
          });
      })
      .catch((err) => {
        console.error(`Promise loop error: `, err);
        throw err;
      });

    // create new csrf to send to postgres DB & client
    const newCSRF = crypto.randomUUID();

    //update postgres DB w/ new csrf
    const updatedUser = await updateUserDBToken(
      foundDBUser.username,
      foundDBUser.refresh_token,
      newCSRF
    );

    if (!updatedUser)
      throw new Error(
        `Updating ${foundDBUser.username} csrf token in DB has failed`
      );

    // new DB csrf successful, now sending new csrf to client

    res.status(200).json({
      message: `All files for ${username} have been deleted.`,
      csrfToken: newCSRF,
    });
  } catch (err) {
    console.error(err);
    Sentry.captureMessage(
      `Error: ${err.message} on 400 ${req.method} ${req.originalUrl}` + "\n\n"
    );
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getAllFiles,
  downloadFile,
  downloadAllFiles,
  uploadFiles,
  deleteFile,
  deleteAllFiles,
};
