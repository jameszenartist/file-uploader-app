import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { FileContext } from "../context/FileContext";
const ProtectedRoute = ({ element: Element }) => {
  const { getSessionData, responseMsg } = useContext(FileContext);
  let { accessToken, LoggedIn } = getSessionData("session");

  if (`${responseMsg}`.includes("Rate limit exceeded")) {
    return <Navigate to="/" replace={true} />;
  }

  if (Element.name === "Logout") {
    return `${responseMsg}`.indexOf("logged out") !== -1 ? (
      <Element />
    ) : (
      <Navigate to="/" replace={true} />
    );
  }

  return !LoggedIn || !accessToken ? (
    <Navigate to="/" replace={true} />
  ) : (
    <Element />
  );
};
export default ProtectedRoute;
