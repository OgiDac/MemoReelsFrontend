import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import HomePage from "../pages/HomePage";
import EventPage from "../pages/EventPage";
import ProtectedRoute from "./ProtectedRoute";
import AlbumPage from "../pages/AlbumPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },

      {
        path: "",
        element: <ProtectedRoute />,
        children: [
          { path: "home", element: <HomePage /> },
          { path: "events/:eventId", element: <EventPage /> },
          { path: "/events/:eventId/albums/:albumId", element: <AlbumPage /> },
        ],
      },
    ],
  },
]);

export default router;
