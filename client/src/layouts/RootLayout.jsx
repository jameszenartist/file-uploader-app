import styles from "../css/styles.module.css";

import { useContext } from "react";
import { useLocation, Outlet, Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Modal from "../components/Modal";
import { FileContext } from "../context/FileContext";

const RootLayout = () => {
  const { responseMsg, useOverlay, handleOverlay } = useContext(FileContext);

  const location = useLocation();
  const path = location.pathname === "/" ? "home" : location.pathname.slice(1);

  return (
    <>
      <Navbar />
      <div
        className={useOverlay ? `${styles.overlay}` : null}
        onClick={handleOverlay}
      ></div>

      <div className={styles.modals}>
        <Modal modalType="register" key="register" />
        <Modal modalType="login" key="login" />
      </div>

      <h1 className={styles.page_title}>{`${path.toUpperCase()} PAGE`}</h1>

      {responseMsg && (
        <p
          className={`${styles.fade_out} ${styles.responseMsg}`}
        >{`${responseMsg}`}</p>
      )}

      <br />

      {`${responseMsg}`.indexOf("logged out") !== -1 && (
        <Navigate to="/logout" replace={true} />
      )}

      <Outlet />

      <footer className={`${styles.footer}`}>
        {" "}
        <h4>
          Copyright ©{" "}
          <span className={`${styles.year}`}>{new Date().getFullYear()}</span>,
          SyntaxSamurai
        </h4>
      </footer>
    </>
  );
};

export default RootLayout;
