import { createContext, useState, useCallback } from "react";

const FileContext = createContext();

export const FileProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState({ register: false, login: false });

  const [responseMsg, setResponseMsg] = useState(null);
  const [uppyResponse, setUppyResponse] = useState(null);
  const [useOverlay, setUseOverlay] = useState(false);
  const [uploads, setUploads] = useState(null);

  const BASE = "https://good-gray-pike-kit.cyclic.app";
  // const BASE = "http://localhost:4444";

  const protectedRoutes = ["welcome", "profile", "logout"];

  const USER_REGEX = /^[A-z][A-z0-9-_]{5,23}$/;
  const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
  const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

  const validateRegUser = (uname, email, pwd) => {
    if (
      !USER_REGEX.test(uname) ||
      !EMAIL_REGEX.test(email) ||
      !PWD_REGEX.test(pwd)
    )
      return false;
    return true;
  };

  if (!getSessionData("session")) {
    setSessionData("session", {
      accessToken: "",
      username: "",
      LoggedIn: false,
      csrfToken: "",
    });
  }

  const registerUser = (data) => {
    try {
      if (!data.username || !data.password || !data.email) return;

      return fetch(`${BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
        .then(async (res) => {
          if (res.status === 429) {
            const { error } = await res.json();
            setSessionData("session", {
              accessToken: "",
              username: "",
              LoggedIn: false,
              csrfToken: "",
            });
            setResponseMsg(error);
            return;
          }

          return res.json();
        })
        .then((data) => {
          if (data.error) throw data.error;
          return data.message;
        })
        .catch((err) => {
          console.log(err);
          setResponseMsg(err);
        });
    } catch (err) {
      console.log(err);
    }
  };

  //if handleLogin is successful, then set
  // access token in session obj

  const handleLogin = (data) => {
    try {
      if (!data.username || !data.password || !data.email) return;
      return fetch(`${BASE}/login`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data ? JSON.stringify(data) : null,
      })
        .then(async (res) => {
          if (res.status === 429) {
            const { error } = await res.json();
            setSessionData("session", {
              accessToken: "",
              username: "",
              LoggedIn: false,
              csrfToken: "",
            });
            setResponseMsg(error);
            return;
          }

          return res.json();
        })
        .then((data) => {
          if (data.error) throw data.error;

          setSessionData("session", {
            accessToken: data.accessToken,
            username: data.username,
            LoggedIn: true,
            csrfToken: data.csrfToken,
          });

          return data;
        })
        .catch((err) => {
          console.log(err);
          setResponseMsg(err);
        });
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = async () => {
    try {
      let { accessToken, LoggedIn } = getSessionData("session");

      const result = await fetch(`${BASE}/logout`, {
        credentials: "include",
      })
        .then(async (res) => {
          if (res.status === 429) {
            const { error } = await res.json();
            setSessionData("session", {
              accessToken: "",
              username: "",
              LoggedIn: false,
              csrfToken: "",
            });
            setResponseMsg(error);
            return;
          }

          if (res.status === 204) {
            setSessionData("session", {
              accessToken: "",
              username: "",
              LoggedIn: false,
              csrfToken: "",
            });
            if (accessToken !== "" && LoggedIn) {
              setResponseMsg("You are currently logged out!");
            }

            return;
          }
        })
        .catch((err) => {
          console.error(err);
        });

      return result;
    } catch (err) {
      console.log(err);
    }
  };

  const downloadFile = async (filename, path) => {
    const { accessToken, username, csrfToken } = getSessionData("session");

    const result = await fetch(`${BASE}/profile/${username}/${filename}`, {
      credentials: "include",
      method: "GET",
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : null,
        "csrf-token": `${csrfToken}`,
      },
    })
      .then(async (res) => {
        if (res.status === 429) {
          const { error } = await res.json();
          setSessionData("session", {
            accessToken: "",
            username: "",
            LoggedIn: false,
            csrfToken: "",
          });
          setResponseMsg(error);
          return;
        }

        if (res.status === 403) {
          setSessionData("session", {
            accessToken: "",
            username: "",
            LoggedIn: false,
            csrfToken: "",
          });
          setResponseMsg("Login status has timed out. Please login.");
          return;
        }
        if (res.status !== 200) {
          const { error } = res.json();
          if (error) throw error;
          return;
        }
        return res.json();
      })
      .catch((err) => {
        throw err;
      });

    if (!result) return;

    //update session data w/ new csrf
    const sessionData = getSessionData("session");
    setSessionData("session", { ...sessionData, csrfToken: result.csrfToken });

    // here postgres DB download time log was successful
    const successMsg = result.data;

    await fetch(path, {
      method: "GET",
      headers: {
        "Content-Disposition": "attachment",
      },
    })
      .then((response) => response.blob())
      .then(async (blob) => {
        const url = window.URL.createObjectURL(new Blob([blob]));

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        link.parentNode.removeChild(link);
        setResponseMsg(successMsg);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const downloadAllFiles = async () => {
    const { accessToken, username, csrfToken } = getSessionData("session");
    try {
      const result = await fetch(`${BASE}/profile/all/${username}`, {
        credentials: "include",
        method: "GET",
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : null,
          "csrf-token": `${csrfToken}`,
        },
      })
        .then(async (res) => {
          if (res.status === 429) {
            const { error } = await res.json();
            setSessionData("session", {
              accessToken: "",
              username: "",
              LoggedIn: false,
              csrfToken: "",
            });
            setResponseMsg(error);
            return;
          }

          if (res.status === 403) {
            setSessionData("session", {
              accessToken: "",
              username: "",
              LoggedIn: false,
              csrfToken: "",
            });
            setResponseMsg("Login status has timed out. Please login.");
            return;
          }
          if (res.status !== 200) {
            const { error } = res.json();
            if (error) throw error;
            return;
          }
          return res.json();
        })
        .catch((err) => console.log(err));

      if (!result) return;

      //update session data w/ new csrf
      const sessionData = getSessionData("session");
      setSessionData("session", {
        ...sessionData,
        csrfToken: result.csrfToken,
      });

      //here postgres DB download files logs & link retrieval was successful

      //now fetching to download zip folder
      await fetch(result.data, {
        method: "GET",
        headers: {
          "Content-Disposition": "attachment",
        },
      })
        .then((response) => response.blob())
        .then(async (blob) => {
          const url = window.URL.createObjectURL(new Blob([blob]));

          const link = document.createElement("a");
          link.href = url;
          link.download = `${username}.zip`;

          document.body.appendChild(link);

          link.click();

          link.parentNode.removeChild(link);
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (err) {
      console.log(err);
    }
  };

  const deleteFile = async (public_id, filename, resource_type) => {
    const { accessToken, username, csrfToken } = getSessionData("session");
    try {
      const result = await fetch(`${BASE}/profile`, {
        credentials: "include",
        method: "DELETE",
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : null,
          "Content-Type": "application/json",
          "csrf-token": csrfToken ? `${csrfToken}` : null,
        },
        body:
          filename && username && public_id && resource_type
            ? JSON.stringify({
                filename: filename,
                username: username,
                public_id: public_id,
                resource_type: resource_type,
              })
            : null,
      })
        .then(async (res) => {
          if (res.status === 429) {
            const { error } = await res.json();
            setSessionData("session", {
              accessToken: "",
              username: "",
              LoggedIn: false,
              csrfToken: "",
            });
            setResponseMsg(error);
            return;
          }

          if (res.status === 403) {
            setSessionData("session", {
              accessToken: "",
              username: "",
              LoggedIn: false,
              csrfToken: "",
            });
            setResponseMsg("Login status has timed out. Please login.");
            return;
          }
          if (res.status !== 200) {
            const { error } = res.json();
            if (error) throw error;
            return;
          }
          return res.json();
        })
        .then((data) => data)
        .catch((err) => console.log(err));

      if (!result) return;

      //update session data w/ new csrf
      const sessionData = getSessionData("session");
      setSessionData("session", {
        ...sessionData,
        csrfToken: result.csrfToken,
      });

      setResponseMsg(result.message);
      return;
    } catch (err) {
      console.log(err);
    }
  };

  const deleteAllFiles = async () => {
    const { accessToken, username, csrfToken } = getSessionData("session");
    try {
      const result = await fetch(`${BASE}/profile/deleteall`, {
        credentials: "include",
        method: "DELETE",
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : null,
          "Content-Type": "application/json",
          "csrf-token": csrfToken ? `${csrfToken}` : null,
        },
        body: username ? JSON.stringify({ username: username }) : null,
      })
        .then(async (res) => {
          if (res.status === 429) {
            const { error } = await res.json();
            setSessionData("session", {
              accessToken: "",
              username: "",
              LoggedIn: false,
              csrfToken: "",
            });
            setResponseMsg(error);
            return;
          }

          if (res.status === 403) {
            setSessionData("session", {
              accessToken: "",
              username: "",
              LoggedIn: false,
              csrfToken: "",
            });
            setResponseMsg("Login status has timed out. Please login.");
            return;
          }
          if (res.status !== 200) {
            const { error } = res.json();
            if (error) throw error;
            return;
          }
          return res.json();
        })
        .then((data) => data)
        .catch((err) => console.log(err));

      if (!result) return;

      //update session data w/ new csrf
      const sessionData = getSessionData("session");
      setSessionData("session", {
        ...sessionData,
        csrfToken: result.csrfToken,
      });

      setResponseMsg(result.message);
      return;
    } catch (err) {
      console.log(err);
    }
  };

  // if req to protected route is successful, then
  // make additional request to refresh route to
  // get new tokens & set session obj again to
  // update w/ new access token

  //changed MakeRequest to adapt to handle getNewTokens use case
  const makeRequest = async (path, method = "GET", data = null) => {
    try {
      const { accessToken, username, LoggedIn, csrfToken } =
        getSessionData("session");
      if (protectedRoutes.includes(`${path}`)) {
        method = "POST";
        data = { username: username };
      }

      let csrf = protectedRoutes.includes(`${path}`) ? `${csrfToken}` : null;

      const result = await fetch(`${BASE}/${path}`, {
        method: method,
        headers: {
          Authorization: accessToken ? `Bearer ${accessToken}` : null,
          "Content-Type": "application/json",
          "csrf-token": csrf,
        },
        body: data ? JSON.stringify(data) : null,
      })
        .then(async (res) => {
          if (res.status === 429) {
            const { error } = await res.json();
            setResponseMsg(error);
            return;
          }
          if (res.status === 401 || res.status === 403 || res.status !== 200) {
            setResponseMsg("Login status has timed out. Please login.");
            if (path === "profile") throw new Error("Accessing files failed.");
            return;
          }
          return res.json();
        })
        .then((data) => data)
        .catch((err) => {
          console.error(err);
        });

      if (!result) {
        setSessionData("session", {
          accessToken: "",
          username: "",
          LoggedIn: false,
          csrfToken: "",
        });
        return;
      }
      if (
        LoggedIn &&
        accessToken !== "" &&
        protectedRoutes.includes(`${path}`)
      ) {
        await getNewTokens();
      }

      if (result && protectedRoutes.includes(`${path}`)) {
        //update session data w/ new csrf
        const sessionData = getSessionData("session");
        setSessionData("session", {
          ...sessionData,
          csrfToken: result.csrfToken,
        });
      }

      return result;
    } catch (err) {
      console.log(err);
    }
  };

  const getNewTokens = () => {
    const { accessToken, username, LoggedIn } = getSessionData("session");

    return fetch(`${BASE}/refresh`, {
      credentials: "include",
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : null,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        //update session data w/ new accessToken, username & LoggedIn status
        const sessionData = getSessionData("session");
        setSessionData("session", {
          ...sessionData,
          accessToken: data.accessToken,
          username: username,
          LoggedIn: LoggedIn,
        });
        console.log("New tokens set.");
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const openModal = (modaltype) => {
    if (!useOverlay) setUseOverlay(true);
    setResponseMsg(null);
    setIsOpen({ [modaltype]: true });
  };
  const closeModal = (modaltype) => {
    if (useOverlay) setUseOverlay(false);
    setIsOpen({ [modaltype]: false });
  };
  const MoveToPage = () => {
    setIsOpen({});
    if (responseMsg) setResponseMsg(null);
    if (uploads) setUploads(null);
  };

  function getSessionData(key) {
    return JSON.parse(sessionStorage.getItem(`${key}`));
  }
  function setSessionData(key, val) {
    sessionStorage.setItem(`${key}`, JSON.stringify(val));
  }

  //handles overlay state
  const handleOverlay = useCallback(() => {
    setUseOverlay((prev) => !prev);
    setIsOpen({});
  }, []);

  return (
    <FileContext.Provider
      value={{
        BASE,
        protectedRoutes,
        validateRegUser,
        registerUser,
        handleLogin,
        handleLogout,
        downloadFile,
        downloadAllFiles,
        deleteFile,
        deleteAllFiles,
        makeRequest,
        getNewTokens,
        isOpen,
        openModal,
        closeModal,
        responseMsg,
        setResponseMsg,
        MoveToPage,
        getSessionData,
        setSessionData,
        handleOverlay,
        useOverlay,
        setUseOverlay,
        uppyResponse,
        setUppyResponse,
        uploads,
        setUploads,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};
export { FileContext };
