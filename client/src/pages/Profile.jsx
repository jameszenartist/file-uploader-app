import styles from "../css/styles.module.css";

import { useContext } from "react";
import Loader from "../components/Loader";
import { FileContext } from "../context/FileContext";
import useLoader from "../hooks/useLoader";
import usePageData from "../hooks/usePageData";

function Profile() {
  const {
    getSessionData,
    downloadFile,
    downloadAllFiles,
    deleteFile,
    deleteAllFiles,
  } = useContext(FileContext);
  let sessionData = getSessionData("session");
  let { isLoading } = useLoader();
  const { isPending, isError, data, error, queryClient } = usePageData();

  if (isError) console.log("React Query Error: ", error.message);
  if (data) console.log("the result from custom hook: ", data);

  let files;

  if (data) {
    files = data.data?.map((file, idx) => {
      return (
        <div key={idx + 1} className={styles.uppy_file}>
          <div>
            <p>Filename: {file.filename}</p>
            <p>Size: {file.size}</p>
            <p>Type: {file.format}</p>
            <button
              className={styles.download_btn}
              onClick={() => downloadFile(file.filename, file.secure_url)}
            >
              Download File
            </button>
            <button
              className={styles.delete_btn}
              onClick={() =>
                deleteFile(
                  file.public_id,
                  file.filename,
                  file.resource_type
                ).then((res) => {
                  queryClient.invalidateQueries();
                })
              }
            >
              &times;
            </button>
          </div>
        </div>
      );
    });
  }

  return (
    <>
      {isPending || isLoading ? (
        <Loader />
      ) : (
        <div className={`${styles.container}`}>
          <br />

          <div className={`${styles.user_files}`}>
            <h3>
              {files?.length === 0 || !files
                ? "No Files Available"
                : `${sessionData.username}` + "'s Files: "}
            </h3>

            <br />

            {files?.length > 0 && (
              <div className={`${styles.scrollbar}`}>{files}</div>
            )}
            <br />

            {files?.length > 0 && (
              <div className={styles.all_btns}>
                <button
                  className={styles.delete_all}
                  onClick={() =>
                    deleteAllFiles().then((res) => {
                      queryClient.invalidateQueries();
                    })
                  }
                >
                  Delete All Files
                </button>

                <button
                  className={styles.download_all_btn}
                  onClick={downloadAllFiles}
                >
                  Download All
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
export default Profile;
