const { Client, Pool } = require("pg");
const format = require("pg-format");
require("dotenv").config();

// 2.5 GB = 2621440 KB
const USER_STORAGE_LIMIT = 2621440;

const pool = new Pool({
  connectionString: process.env.PG_DATABASE_URL,
  ssl: {
    require: true,
  },
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  idleTimeoutMillis: 60000,
  reapIntervalMillis: 30000,
  allowExitOnIdle: true,
});

const createUsersTableText = `CREATE TABLE users (
  user_id BIGSERIAL PRIMARY KEY NOT NULL,
  username TEXT,
  email TEXT UNIQUE,
  password TEXT,
  logged_in TEXT,
  refresh_token TEXT,
  csrf_token TEXT
);`;
const createUserFilesTableText = `CREATE TABLE user_files (
  file_id BIGSERIAL PRIMARY KEY NOT NULL,
  username TEXT,
  file_type TEXT,
  file_size INTEGER,
  file_name TEXT,
  upload_time TEXT,
  download_time TEXT[] DEFAULT '{}'
);`;

async function checkForRowData(tableName) {
  const client = await pool.connect();
  try {
    const sql = format(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = %L
    );`,
      tableName
    );
    // Check if the table exists
    const result = await client.query(sql);
    client.release();

    return result.rows[0].exists;
  } catch (err) {
    console.error("Table creation error: ", err);
    client.release();
    throw err;
  }
}

async function createTable(tableName, createCommand) {
  const client = await pool.connect();

  try {
    const sql = format(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = %L
    );`,
      tableName
    );
    // Check if the table exists
    const result = await client.query(sql);

    const tableExists = result.rows[0].exists;
    if (!tableExists) {
      // Create the table if it doesn't exist
      await client.query(createCommand);

      console.log("Table created successfully!");
      client.release();
    } else {
      client.release();
    }
  } catch (err) {
    console.error("Table creation error: ", err);
    client.release();
    throw err;
  }
}
async function clearTable(tableName) {
  const client = await pool.connect();

  try {
    const query = `DELETE FROM ${tableName};`;
    await client.query(query);
    console.log(`All rows deleted from ${tableName}`);
    client.release();
    return true;
  } catch (err) {
    console.error("Error clearing table:", err);
    client.release();
  }
}

(async () => {
  try {
    //creating both tables if they don't exist
    await createTable("users", createUsersTableText).catch((err) => {
      console.log(`Error w/ creating 1st table: ${err}`);
    });
    await createTable("user_files", createUserFilesTableText).catch((err) => {
      console.log(`Error w/ creating 2nd table: ${err}`);
    });

    // TODO: remove later
    // let currDate = new Date().toLocaleString("en-US", {
    //   timeZone: "America/Los_Angeles",
    // });
    // console.log("current time: ", currDate);

    // const result = await clearTable("user_files");
    // if (result) {
    //   await deleteAllAssets();

    //   console.log(`Delete all Cloudinary Assets Successful @ ${currDate}`);
    // }
    // await deleteTable("users");
    // await deleteTable("user_files");
  } catch (err) {
    console.log(err);
  }
})();

//terminate connection if error occurs
pool.on("error", async (err) => {
  console.error("Pool Error:", err);
  try {
    // Attempt to end the pool gracefully
    await pool.end();
    console.log("Pool has been closed");
  } catch (err) {
    console.error("Error closing the pool:", err);
  }
});

// GET methods:

async function getUser(col, val) {
  const client = await pool.connect();

  const user = await client.query(`SELECT * FROM users WHERE ${col} = $1`, [
    val,
  ]);
  client.release();
  return user.rows[0];
}

async function getCurrentStorageAmt(username) {
  const client = await pool.connect();
  try {
    const text = format(
      `SELECT SUM(file_size) AS total
    FROM user_files
    WHERE username = %L`,
      `${username}`
    );
    const result = await client.query(text);
    client.release();
    return result.rows[0].total === null ? 0 : result.rows[0].total;
  } catch (err) {
    console.error(err);
    client.release();
    throw err;
  }
}

// POST methods:

async function addUser(username, email, password) {
  const client = await pool.connect();

  try {
    const text = format(
      "INSERT INTO users (username, email, password) VALUES(%L, %L, %L) RETURNING *",
      username,
      email,
      password
    );

    const newUser = await client.query(text);
    client.release();
    return newUser.rows[0];
  } catch (err) {
    console.error(err);
    client.release();
    throw err;
  }
}

async function addFile(username, obj) {
  const client = await pool.connect();

  try {
    const text = format(
      "INSERT INTO user_files (username, file_type, file_size, file_name, upload_time) VALUES(%L, %L, %L, %L, %L) RETURNING *",
      username,
      obj.mimetype,
      obj.size,
      obj.filename,
      obj.uploadTime
    );

    const newUser = await client.query(text);
    client.release();
    return newUser.rows[0];
  } catch (err) {
    console.error(err);
    client.release();
    throw err;
  }
}

// PUT methods:
async function userLogin(username, token, csrf) {
  const client = await pool.connect();
  try {
    const text = format(
      ` UPDATE users
      SET refresh_token = %L,
      csrf_token = %L,
      logged_in = %L
      WHERE username = %L`,
      `${token}`,
      `${csrf}`,
      `${new Date().toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
      })}`,
      `${username}`
    );
    const result = await client.query(text);
    client.release();
    return result.rowCount;
  } catch (err) {
    console.error(err);
    client.release();
    throw err;
  }
}
async function updateUserDBToken(username, token, csrf) {
  const client = await pool.connect();
  try {
    const text = format(
      ` UPDATE users
      SET refresh_token = %L,
      csrf_token = %L
      WHERE username = %L`,
      `${token}`,
      `${csrf}`,
      `${username}`
    );
    const result = await client.query(text);
    client.release();
    return result.rowCount;
  } catch (err) {
    console.error(err);
    client.release();
    throw err;
  }
}

async function updateDownloadFileTime(username, filename) {
  const client = await pool.connect();
  try {
    const text = format(
      ` UPDATE user_files
      SET download_time = ARRAY_APPEND(download_time, %L)
      WHERE username = %L
      AND file_name = %L`,
      `${new Date().toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
      })}`,
      `${username}`,
      `${filename}`
    );
    const result = await client.query(text);
    client.release();
    return result.rowCount;
  } catch (err) {
    console.error(err);
    client.release();
    throw err;
  }
}

async function updateDownloadTimes(username) {
  const client = await pool.connect();
  try {
    const text = format(
      ` UPDATE user_files
      SET download_time = ARRAY_APPEND(download_time, %L)
      WHERE username = %L`,
      `${new Date().toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
      })}`,
      `${username}`
    );
    const result = await client.query(text);
    client.release();
    return result.rowCount;
  } catch (err) {
    console.error(err);
    client.release();
    throw err;
  }
}

// DELETE methods:

async function deleteUser(username) {
  const client = await pool.connect();

  const deletedUser = client.query("DELETE FROM users WHERE username = $1", [
    username,
  ]);
  console.log("deleted user is: ", deletedUser);
  client.release();
}

async function deleteTable(tableName) {
  const client = await pool.connect();
  try {
    const sql = format(`DROP TABLE IF EXISTS %s;`, tableName);
    await client.query(sql);
    console.log(`${tableName} table deleted successfully`);
    client.release();
  } catch (err) {
    console.error("Error deleting table:", err);
    client.release();
    throw err;
  }
}

// func to delete single file data or all files data assoc w/ username
async function deleteDBFiles(username, filename) {
  const client = await pool.connect();
  try {
    let text;

    // if no filename, that means delete all user files data
    if (!filename) {
      text = format(
        `DELETE FROM user_files
        WHERE username = %L`,
        `${username}`
      );
    } else {
      text = format(
        `DELETE FROM user_files
        WHERE username = %L
        AND file_name = %L`,
        `${username}`,
        `${filename}`
      );
    }

    const result = await client.query(text);
    client.release();
    return result.rowCount;
  } catch (err) {
    console.error(err);
    client.release();
    throw err;
  }
}

module.exports = {
  USER_STORAGE_LIMIT,
  checkForRowData,
  clearTable,
  getUser,
  getCurrentStorageAmt,
  addUser,
  addFile,
  userLogin,
  updateUserDBToken,
  updateDownloadFileTime,
  updateDownloadTimes,
  deleteUser,
  deleteDBFiles,
};
