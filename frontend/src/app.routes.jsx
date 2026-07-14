import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "./features/auth/pages/login";
import Register from "./features/auth/pages/register";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import InterviewReport from "./features/interview/pages/interview"; // ✅ import your report page

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register />
  },
  {
    // ✅ Fixed: was "/protected", should be "/home"
    path: "/home",
    element: (
      <Protected>
        <Home />
      </Protected>
    )
  },
  {
    // ✅ Added: missing interview report route
    path: "/interview/:interviewId",
    element: (
      <Protected>
        <InterviewReport />
      </Protected>
    )
  }
]);