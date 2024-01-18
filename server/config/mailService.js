const nodemailer = require("nodemailer");
const { google } = require("googleapis");
require("dotenv").config();

const oAuth2Client = new google.auth.OAuth2(
  `${process.env.OAUTH_CLIENT_ID}`,
  `${process.env.OAUTH_CLIENT_SECRET}`,
  `${process.env.OAUTH_REDIRECT_URI}`
);
oAuth2Client.setCredentials({
  refresh_token: `${process.env.OAUTH_REFRESH_TOKEN}`,
});

async function getOAuthToken() {
  return new Promise((resolve) => {
    const result = oAuth2Client.getAccessToken();
    return resolve(result);
  });
}

const transporter = nodemailer.createTransport({
  service: process.env.NODEMAILER_SERVICE,
  secure: true,
  auth: {
    type: "oAuth2",
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASSWORD,
    clientId: `${process.env.OAUTH_CLIENT_ID}`,
    clientSecret: `${process.env.OAUTH_CLIENT_SECRET}`,
    refreshToken: `${process.env.OAUTH_REFRESH_TOKEN}`,
    accessToken: () => getOAuthToken(),
  },
});

// accepts data to write to file
const mailService = async (data) => {
  if (!data || data.length === 0) return;
  const buffer = Buffer.from(data);
  const timestamp = Date.now();
  let newFileName = `${timestamp}-dailyLogs.txt`;

  try {
    const currDate = `${new Date().toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
    })}\n`;

    const mailOptions = {
      from: process.env.NODEMAILER_USER,
      to: process.env.NODEMAILER_USER,
      subject: `Sentry Logs: logging system entries for ${currDate}`,
      text: "Please find the attached files.",
      contentType: "text/plain",
      attachments: [{ filename: newFileName, content: buffer }],
    };

    // send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);

    console.log("Message sent: %s", info.messageId);
    return info.messageId;
  } catch (err) {
    console.error("Error sending email w/ Nodemailer:", err);
    throw err;
  }
};

module.exports = mailService;
