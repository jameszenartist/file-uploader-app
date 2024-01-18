import styles from "../css/styles.module.css";

import { Link } from "react-router-dom";
import { useContext } from "react";
import { FileContext } from "../context/FileContext";

export function Navbar() {
  const { getSessionData, openModal, handleLogout, MoveToPage } =
    useContext(FileContext);
  let { LoggedIn } = getSessionData("session");

  return (
    <>
      <nav className={`${styles.navbar}`}>
        <Link to="/">
          <button type="button" onClick={MoveToPage}>
            Home
          </button>
        </Link>
        <Link to="/about">
          <button type="button" onClick={MoveToPage}>
            About
          </button>
        </Link>
        <Link to="/contact">
          <button type="button" onClick={MoveToPage}>
            Contact
          </button>
        </Link>
        {LoggedIn && (
          <>
            <Link to="/welcome">
              <button type="button" onClick={MoveToPage}>
                Upload
              </button>
            </Link>
            <Link to="/profile">
              <button type="button" onClick={MoveToPage}>
                Profile
              </button>
            </Link>
          </>
        )}

        <button onClick={() => openModal("register")}>Register</button>
        <button onClick={() => openModal("login")}>Login</button>
        <button onClick={handleLogout}>Logout</button>
      </nav>
    </>
  );
}

export default Navbar;
