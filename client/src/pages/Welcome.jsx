import styles from "../css/styles.module.css";
import { useContext } from "react";
import Loader from "../components/Loader";
import UppyLoader from "../components/UppyLoader";
import UploadLinks from "../components/UploadLinks";
import { FileContext } from "../context/FileContext";
import useLoader from "../hooks/useLoader";
import usePageData from "../hooks/usePageData";

function Welcome() {
  const { uppyResponse, getSessionData } = useContext(FileContext);
  let { LoggedIn, username } = getSessionData("session");
  let { isLoading } = useLoader();
  const { isPending, isError, data, error } = usePageData();
  if (isError) console.log("React Query Error: ", error.message);
  if (data) console.log("the result from custom hook: ", data);

  return (
    <>
      {isPending || isLoading ? (
        <Loader />
      ) : (
        <>
          <h2 className={styles.welcome_user}>
            Welcome {username && LoggedIn ? username : "Guest"}!{" "}
          </h2>
          <br />

          <div className={`${styles.container}`}>
            {uppyResponse && (
              <p className={`${styles.uppy_data}`}>{`${uppyResponse}`}</p>
            )}

            <UploadLinks />
            <div>
              <UppyLoader />
            </div>
          </div>
        </>
      )}
    </>
  );
}
export default Welcome;
