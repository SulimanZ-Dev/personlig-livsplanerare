import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { AuthProvider } from "./core/sync/AuthContext";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><ErrorBoundary><AuthProvider><App /></AuthProvider></ErrorBoundary></React.StrictMode>
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hadController && !refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      registration.update();
      window.setInterval(() => registration.update(), 60 * 60 * 1000);
    }).catch(() => {});
  });
}
