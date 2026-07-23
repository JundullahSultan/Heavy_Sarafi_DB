import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { PopupProvider } from "./context/PopupContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <PopupProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PopupProvider>
    </LanguageProvider>
  </React.StrictMode>,
);

// Register service worker for PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("Service Worker registered successfully:", reg.scope))
      .catch((err) => console.error("Service Worker registration failed:", err));
  });
}

