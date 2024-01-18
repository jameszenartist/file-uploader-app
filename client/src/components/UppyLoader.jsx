import styles from "../css/styles.module.css";

import { useContext } from "react";
import Uppy from "@uppy/core";
import Webcam from "@uppy/webcam";
import XHRUpload from "@uppy/xhr-upload";
import Compressor from "@uppy/compressor";
import { Dashboard } from "@uppy/react";
import { FileContext } from "../context/FileContext";

import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import "@uppy/drag-drop/dist/style.min.css";
import "@uppy/webcam/dist/style.min.css";

export default function UppyLoader() {
  const { BASE, setUploads, getSessionData, setSessionData, setUppyResponse } =
    useContext(FileContext);
  let { accessToken, username, csrfToken } = getSessionData("session");
  //creating new uppy instance
  // target is the front end html tag
  const uppy = new Uppy({
    maxFileSize: 10 * 1024 * 1024,
    maxNumberOfFiles: 5,
    meta: {
      username: `${username}`,
    },
  })
    .use(Compressor)
    .use(Webcam, { modes: ["picture"] })
    .use(XHRUpload, {
      endpoint: `${BASE}/uploads`,
      fieldName: "single_file",
      formData: true,
      bundle: true,
      withCredentials: true,

      // Set the Authorization header with the Bearer token
      headers: {
        Authorization: `Bearer ${accessToken ? accessToken : null}`,
        "csrf-token": `${csrfToken}`,
      },
      getResponseError(content, xhr) {
        console.log("responseError: ", content, xhr);
        return JSON.parse(content);
      },
    })
    .on("upload-error", (file, error, response) => {
      console.log("err status is: ", response.status);

      if (error.isNetworkError) {
        console.log("Uppy network error");
        console.log(error.stack);
        setUppyResponse(`${error}`);
      } else {
        //status 401 means JWT middleware failed

        console.log(`error with file: ${file.id}`, error.message);
        setUppyResponse(`Unauthorized ${error.message}. Please login.`);
      }
      return;
    })
    .on("complete", (result) => {
      const links = result.successful[0].response.body.data;
      const csrfToken = result.successful[0].response.body.csrfToken;

      if (result.failed.length) {
        for (const file of result.failed) {
          console.log("failed file: ", file);
        }
        setUppyResponse(`File errors: ${result.failed}`);
      }

      const sessionData = getSessionData("session");
      setSessionData("session", {
        ...sessionData,
        csrfToken: csrfToken,
      });

      const blobLinks = [];
      if (result.successful.length) {
        result.successful.forEach((file, idx) => {
          blobLinks.push({
            id: file.id,
            name: file.name,
            link: links ? links[idx] : null,
          });
        });
      }
      setUploads(blobLinks);
    });

  return <Dashboard uppy={uppy} inline={true} plugins={["Webcam"]} />;
}
