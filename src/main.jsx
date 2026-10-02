import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import App from "./App";
import Dashboard from "./pages/Dashboard/Dashboard";
import Satellite from "./pages/Satellite/Satellite";

import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/satellite",
    Component: Satellite,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);