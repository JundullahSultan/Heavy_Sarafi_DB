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
