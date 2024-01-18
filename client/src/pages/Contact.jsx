import styles from "../css/styles.module.css";
import { Navigate } from "react-router-dom";

import Loader from "../components/Loader";
import useLoader from "../hooks/useLoader";
import usePageData from "../hooks/usePageData";
import { useContext } from "react";
import { FileContext } from "../context/FileContext";

export function Contact() {
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
              Hey Everyone!!,
              <br />
              <br />
              If you’re interested in more of my projects, they can be found
              <a
                href="https://syntaxsamurai.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                &nbsp;here
              </a>
              , as well as on my
              <a
                href="https://github.com/jameszenartist"
                target="_blank"
                rel="noopener noreferrer"
              >
                &nbsp;Github&nbsp;
              </a>
              Account.
              <br />
              <br />
              Again, thanks for looking! <br />
              <br />
              -James Hansen
            </p>
          </div>
        </>
      )}
    </>
  );
}
export default Contact;
