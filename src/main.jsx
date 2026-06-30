import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx"; // <-- Import

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      {" "}
      {/* <-- Wrap App */}
      <App />
    </LanguageProvider>
  </React.StrictMode>,
);
