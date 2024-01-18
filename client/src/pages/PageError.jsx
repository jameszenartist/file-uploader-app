import styles from "../css/styles.module.css";
import { Link, useRouteError, useLocation } from "react-router-dom";

const PageError = () => {
  const location = useLocation();
  const error = useRouteError();
  return (
    <div className={`${styles.pageError}`}>
      <h2 style={{ textTransform: "capitalize" }}>
        {location.pathname.slice(1)} Page Error
      </h2>
      <p>{error.message}</p>
      <Link to="/">
        <button type="button">Back to Homepage</button>
      </Link>
    </div>
  );
};

export default PageError;
