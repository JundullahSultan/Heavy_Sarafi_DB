// src/context/PopupContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import "./PopupContext.css";

const PopupContext = createContext(null);

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error("usePopup must be used within a PopupProvider");
  }
  return context;
};

const defaultLabels = {
  en: {
    ok: "OK",
    yes: "Yes",
    cancel: "Cancel",
    confirm: "Confirm",
    info: "Information",
    success: "Success",
    warning: "Warning",
    error: "Error"
  },
  ps: {
    ok: "ښه",
    yes: "هو",
    cancel: "لغوه کول",
    confirm: "تایید",
    info: "معلومات",
    success: "بریالی",
    warning: "خبرداری",
    error: "تېروتنه"
  },
  da: {
    ok: "خوب",
    yes: "بله",
    cancel: "لغو",
    confirm: "تایید",
    info: "اطلاعات",
    success: "موفقیت",
    warning: "هشدار",
    error: "خطا"
  }
};

export const PopupProvider = ({ children }) => {
  const { language } = useLanguage();
  const [popup, setPopup] = useState({
    isOpen: false,
    type: "alert", // "alert" | "confirm"
    title: "",
    message: "",
    severity: "info", // "info" | "success" | "warning" | "error"
    confirmText: "",
    cancelText: "",
    resolve: null,
  });

  // Handle escape key to close popup
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && popup.isOpen) {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [popup.isOpen, popup.resolve]);

  const labels = defaultLabels[language] || defaultLabels.en;

  const showAlert = (message, options = {}) => {
    return new Promise((resolve) => {
      // Determine default severity based on keywords in message if not specified
      let severity = options.severity || "info";
      if (!options.severity) {
        const msg = String(message).toLowerCase();
        if (msg.includes("error") || msg.includes("fail") || msg.includes("invalid")) {
          severity = "error";
        } else if (msg.includes("success") || msg.includes("save") || msg.includes("record") || msg.includes("open")) {
          severity = "success";
        }
      }

      setPopup({
        isOpen: true,
        type: "alert",
        title: options.title || labels[severity] || labels.info,
        message,
        severity,
        confirmText: options.confirmText || labels.ok,
        cancelText: "",
        resolve,
      });
    });
  };

  const showConfirm = (message, options = {}) => {
    return new Promise((resolve) => {
      // For confirmation, default severity is often "warning" because it prompts for action
      let severity = options.severity || "warning";
      if (!options.severity) {
        const msg = String(message).toLowerCase();
        if (msg.includes("delete") || msg.includes("remove") || msg.includes("permanently")) {
          severity = "error"; // dangerous operations get error coloring
        }
      }

      setPopup({
        isOpen: true,
        type: "confirm",
        title: options.title || labels[severity] || labels.warning,
        message,
        severity,
        confirmText: options.confirmText || labels.yes,
        cancelText: options.cancelText || labels.cancel,
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    if (popup.resolve) {
      popup.resolve(true);
    }
    setPopup((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (popup.resolve) {
      popup.resolve(false);
    }
    setPopup((prev) => ({ ...prev, isOpen: false }));
  };

  // Determine icon based on severity
  const getIcon = () => {
    switch (popup.severity) {
      case "success":
        return <CheckCircle2 className="popup-icon success-icon" size={48} />;
      case "warning":
        return <AlertTriangle className="popup-icon warning-icon" size={48} />;
      case "error":
        return <XCircle className="popup-icon error-icon" size={48} />;
      case "info":
      default:
        return <Info className="popup-icon info-icon" size={48} />;
    }
  };

  const isRTL = language === "ps" || language === "da";

  return (
    <PopupContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {popup.isOpen && (
        <div className="popup-overlay animate-fade-in" onClick={handleCancel}>
          <div
            className={`popup-card animate-scale-up ${isRTL ? "rtl" : "ltr"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="popup-close-btn" onClick={handleCancel} aria-label="Close">
              <X size={18} />
            </button>

            <div className="popup-header">
              <div className="popup-icon-container">
                {getIcon()}
              </div>
              <h3 className="popup-title">{popup.title}</h3>
            </div>

            <div className="popup-body">
              <p className="popup-message">{popup.message}</p>
            </div>

            <div className="popup-footer">
              {popup.type === "confirm" ? (
                <>
                  <button className="popup-btn popup-btn-secondary" onClick={handleCancel}>
                    {popup.cancelText}
                  </button>
                  <button
                    className={`popup-btn popup-btn-primary popup-btn-${popup.severity}`}
                    onClick={handleConfirm}
                  >
                    {popup.confirmText}
                  </button>
                </>
              ) : (
                <button
                  className={`popup-btn popup-btn-primary popup-btn-${popup.severity} popup-btn-full`}
                  onClick={handleConfirm}
                >
                  {popup.confirmText}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
};
