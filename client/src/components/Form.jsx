import styles from "../css/styles.module.css";

import { useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { FileContext } from "../context/FileContext";
function Form({ modalType }) {
  const navigate = useNavigate();
  const {
    validateRegUser,
    handleLogin,
    registerUser,
    closeModal,
    handleOverlay,
    setResponseMsg,
    setUppyResponse,
    setUploads,
  } = useContext(FileContext);

  const countRef = useRef(0);

  useEffect(() => {
    countRef.current = countRef.current + 1;
  });

  // modified handleSubmit func
  // now, & without using state, it doesn't
  // trigger any re-renders
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const form = new FormData(e.currentTarget);
      const username = form.get("username");
      const password = form.get("password");
      const email = form.get("email");

      const body = {};
      for (const [key, value] of form.entries()) {
        body[key] = value;
      }
      // console.log("The form data being sent: ", body);
      // Do Further input validation and submit the form
      if (Object.keys(body).length === 0) {
        throw new Error(`Form values are required.`);
      } else {
        //if either modals are successful, then
        // should close modal & redirect to appropriate page
        let result;
        if (modalType === "register") {
          // checking form fields for valid entries

          const regCheck = validateRegUser(username, email, password);
          if (!regCheck) {
            closeModal(`${modalType}`);
            setResponseMsg("Valid username, email, & password is required.");

            return;
          }

          result = await registerUser(body);
          if (result) {
            console.log(result);
            closeModal(`${modalType}`);
          } else {
            handleOverlay();
          }
        }
        if (modalType === "login") {
          result = await handleLogin(body);
          if (result) {
            setResponseMsg((prev) => {
              if (prev) prev = null;
            });
            setUppyResponse((prev) => {
              if (prev) prev = null;
            });
            setUploads((prev) => {
              if (prev) prev = null;
            });

            navigate("/welcome");
            closeModal(`${modalType}`);
          } else {
            handleOverlay();
          }
        }
        return;
      }
    } catch (err) {
      console.log(err);
      if (!err?.response) {
        console.log(`No server response.`);
      } else if (err.response?.status === 409 && modalType === "register") {
        console.log("User already exists.");
      } else {
        if (modalType === "register") {
          console.log("Registration failed.");
        }

        console.log(err.message);
      }
    }
    return;
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">
          Username:
          <br />
          <input
            id="username"
            type="text"
            name="username"
            // value={username}
            // onChange={(e) => setUsername(e.target.value)}
            size={20}
            placeholder="Enter your username"
            required
            aria-required="true"
            autoComplete="off"
          />
        </label>

        <br />
        <label htmlFor="email">
          Email:
          <br />
          <input
            id="email"
            type="email"
            name="email"
            size={20}
            placeholder="Enter your email"
            required
            aria-required="true"
            autoComplete="off"
          />
        </label>

        <br />
        <label htmlFor="password">
          Password:
          <br />
          <input
            id="password"
            type="password"
            name="password"
            // value={password}
            // onChange={(e) => setPassword(e.target.value)}
            size={20}
            placeholder="Enter your password"
            required
            aria-required="true"
          />
        </label>

        <br />
        <br />

        <button type="submit" style={{ textTransform: "capitalize" }}>
          {modalType}
        </button>
      </form>
    </>
  );
}
export default Form;
