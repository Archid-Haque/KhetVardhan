import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";

import App from "./App";
import Dashboard from "./pages/Dashboard/Dashboard";
import Satellite from "./pages/Satellite/Satellite";
import Account from "./pages/Account";
import Missions from "./pages/Missions";
import Fields from "./pages/Fields";
import Observations from "./pages/Observations";
import AppShell from "./components/AppShell";

import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    children: [
      { index: true, Component: App },
      { path: "dashboard", Component: Dashboard },
      { path: "fields", Component: Fields },
      { path: "observations", Component: Observations },
      { path: "satellite", Component: Satellite },
      { path: "missions", Component: Missions },
      { path: "account", Component: Account },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
