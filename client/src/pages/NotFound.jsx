import styles from "../css/styles.module.css";
import Loader from "../components/Loader";
import { Link } from "react-router-dom";
import useLoader from "../hooks/useLoader";

function NotFound() {
  let { isLoading } = useLoader();

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className={`${styles.container}`}>
          <h1>Oops! You seem to be lost.</h1>
          <p>Here are some helpful links:</p>
          <Link to="/">
            <button className={`${styles.notfound_btn}`} type="button">
              Home
            </button>
          </Link>
          <Link to="/About">
            <button className={`${styles.notfound_btn}`} type="button">
              About
            </button>
          </Link>
          <Link to="/Contact">
            <button className={`${styles.notfound_btn}`} type="button">
              Contact
            </button>
          </Link>
        </div>
      )}
    </>
  );
}

export default NotFound;
