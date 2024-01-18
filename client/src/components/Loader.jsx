import styles from "../css/styles.module.css";

function Loader() {
  return (
    <div className={`${styles.loader}`}>
      <h1>Loading...</h1>
    </div>
  );
}

export default Loader;
