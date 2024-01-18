import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Welcome from "./pages/Welcome";
import Profile from "./pages/Profile";
import Logout from "./pages/Logout";

import NotFound from "./pages/NotFound";
import PageError from "./pages/PageError";
import RootLayout from "./layouts/RootLayout";
import ProtectedRoute from "./HOC/ProtectedRoute";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="about" element={<About />} errorElement={<PageError />} />
      <Route
        path="contact"
        element={<Contact />}
        errorElement={<PageError />}
      />

      <Route
        path="welcome"
        element={<ProtectedRoute element={Welcome} />}
        errorElement={<PageError />}
      />

      <Route
        path="profile"
        element={<ProtectedRoute element={Profile} />}
        errorElement={<PageError />}
      />

      <Route
        path="logout"
        element={<ProtectedRoute element={Logout} />}
        errorElement={<PageError />}
      />
      <Route path="*" element={<NotFound />} errorElement={<PageError />} />
    </Route>
  )
);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
