// src/context/PopupContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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

let toastIdCounter = 0;

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

  // Toast notification state
  const [toasts, setToasts] = useState([]);
  const toastTimers = useRef({});

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

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      Object.values(toastTimers.current).forEach(clearTimeout);
    };
  }, []);

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

  /**
   * Show a non-blocking toast notification in the corner.
   * @param {string} message - The toast message
   * @param {object} options - { severity: "success"|"error"|"warning"|"info", duration: ms }
   */
  const showToast = useCallback((message, options = {}) => {
    const id = ++toastIdCounter;
    const severity = options.severity || "success";
    const duration = options.duration || 4000;

    const newToast = { id, message, severity, exiting: false };
    setToasts((prev) => [...prev, newToast]);

    // Start exit animation before removing
    toastTimers.current[id] = setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );
      // Remove after exit animation completes
      toastTimers.current[`${id}-remove`] = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        delete toastTimers.current[id];
        delete toastTimers.current[`${id}-remove`];
      }, 350);
    }, duration);

    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    clearTimeout(toastTimers.current[id]);
    clearTimeout(toastTimers.current[`${id}-remove`]);
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 350);
  }, []);

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
  const getIcon = (severity, size = 48) => {
    switch (severity) {
      case "success":
        return <CheckCircle2 className="popup-icon success-icon" size={size} />;
      case "warning":
        return <AlertTriangle className="popup-icon warning-icon" size={size} />;
      case "error":
        return <XCircle className="popup-icon error-icon" size={size} />;
      case "info":
      default:
        return <Info className="popup-icon info-icon" size={size} />;
    }
  };

  const getToastIcon = (severity) => {
    switch (severity) {
      case "success":
        return <CheckCircle2 className="toast-severity-icon success-icon" size={20} />;
      case "warning":
        return <AlertTriangle className="toast-severity-icon warning-icon" size={20} />;
      case "error":
        return <XCircle className="toast-severity-icon error-icon" size={20} />;
      case "info":
      default:
        return <Info className="toast-severity-icon info-icon" size={20} />;
    }
  };

  const isRTL = language === "ps" || language === "da";

  return (
    <PopupContext.Provider value={{ showAlert, showConfirm, showToast, dismissToast }}>
      {children}

      {/* Modal Popup */}
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
                {getIcon(popup.severity)}
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

      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className={`toast-container ${isRTL ? "toast-rtl" : "toast-ltr"}`}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast-item toast-${toast.severity} ${
                toast.exiting ? "toast-exit" : "toast-enter"
              }`}
            >
              <div className="toast-icon-area">
                {getToastIcon(toast.severity)}
              </div>
              <span className="toast-message">{toast.message}</span>
              <button
                className="toast-close"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
              <div
                className="toast-progress"
                style={{ animationDuration: "4s" }}
              />
            </div>
          ))}
        </div>
      )}
    </PopupContext.Provider>
  );
};
