import styles from "../css/styles.module.css";

import Loader from "../components/Loader";
import { useContext } from "react";
import { FileContext } from "../context/FileContext";
import useLoader from "../hooks/useLoader";

function Home() {
  let { isLoading } = useLoader();

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <div className={`${styles.container}`}>
            <h2>Welcome to my File Storage App!</h2>
            <br />

            <p>
              If you would like to start uploading files, please feel to
              register & sign in!
            </p>
          </div>
        </>
      )}
    </>
  );
}
export default Home;
