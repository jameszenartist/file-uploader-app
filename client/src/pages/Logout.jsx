import styles from "../css/styles.module.css";

import Loader from "../components/Loader";
import useLoader from "../hooks/useLoader";

function Logout() {
  let { isLoading } = useLoader();

  return (
    <>
      {isLoading ? <Loader /> : <div className={`${styles.container}`}></div>}
    </>
  );
}
export default Logout;
