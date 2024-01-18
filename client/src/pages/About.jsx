import styles from "../css/styles.module.css";
import { Navigate } from "react-router-dom";

import Loader from "../components/Loader";
import usePageData from "../hooks/usePageData";
import useLoader from "../hooks/useLoader";
import { useContext } from "react";
import { FileContext } from "../context/FileContext";

function About() {
  let { isLoading } = useLoader();
  const { responseMsg } = useContext(FileContext);

  const { isPending, isError, data, error } = usePageData();
  if (isError) console.log("React Query Error: ", error.message);
  if (data) console.log("the result from custom hook: ", data);

  if (`${responseMsg}`.includes("Rate limit exceeded")) {
    return <Navigate to="/" replace={true} />;
  }

  return (
    <>
      {isPending || isLoading ? (
        <Loader />
      ) : (
        <>
          <br />

          <div className={`${styles.container}`}>
            <br />

            <p>
              Greetings Everyone,
              <br />
              <br />
              Welcome to my new File Upload Storage App!
              <br />
              <br />
              Just in case you're interested, I must forewarn you though as this
              application isn't meant for real-life production grade purposes.
              <br />
              <br />
              Everything works as intended, it's just not meant for long term
              storage.
              <br />
              <br />
              You can create an account, login, upload & download files, etc.,
              it's just that I have preconfigured some routine scheduled
              functions that clear the appropriate data for the sake of
              simplicity and security for all those involved.
              <br />
              <br />
              The predominant reason's why this was built, was for educational
              purposes, as well as a test of my knowledge with Javascript, JWTs,
              postgres, OWASP concepts, project architecture, and Full Stack
              Development.
              <br />
              <br />
              Please feel free to give it a go!
              <br />
              <br />I hope you enjoy and thanks for looking!
            </p>
          </div>
        </>
      )}
    </>
  );
}
export default About;
