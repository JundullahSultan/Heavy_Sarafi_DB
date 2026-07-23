import React, { useState, useEffect } from "react";
import { X, Download, Share, Plus } from "lucide-react";
import "./InstallPrompt.css";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed or installed the app
    const isDismissed = localStorage.getItem("pwa_prompt_dismissed");
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

    if (isDismissed || isInstalled) {
      return;
    }

    // Identify iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(iosDevice);

    // Handler for native installation prompt on Android/Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait a short delay before showing the install banner to let user settle in
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Fallback logic: if it is iOS, prompt manually after a delay
    if (iosDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => clearTimeout(timer);
    }

    // Fallback for Android browsers that don't trigger beforeinstallprompt (e.g., standard fallback message)
    // We can show it if they are on a mobile device and we haven't got the prompt after 5 seconds
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    if (isMobile && !iosDevice) {
      const timer = setTimeout(() => {
        // If beforeinstallprompt didn't trigger, we can still show a general manual guidance prompt
        setShowPrompt((prev) => {
          if (deferredPrompt) return prev; // already have native
          return true; // show guide
        });
      }, 6000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Manual Android install instructions if deferredPrompt wasn't caught but clicked
      alert("To install: Open your browser menu (three dots in top right) and tap 'Add to Home Screen' or 'Install App'.");
      handleDismiss();
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    setDeferredPrompt(null);
    setShowPrompt(false);

    if (outcome === "accepted") {
      localStorage.setItem("pwa_prompt_dismissed", "true");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    const expiry = new Date().getTime() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem("pwa_prompt_dismissed", expiry.toString());
  };

  // Check if dismissal has expired
  useEffect(() => {
    const dismissVal = localStorage.getItem("pwa_prompt_dismissed");
    if (dismissVal && dismissVal !== "true") {
      const timestamp = parseInt(dismissVal, 10);
      if (!isNaN(timestamp) && new Date().getTime() > timestamp) {
        localStorage.removeItem("pwa_prompt_dismissed");
      }
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="install-prompt-banner">
      <div className="install-prompt-content">
        <div className="app-info">
          <div className="app-icon-container">
            <span className="app-prompt-logo">💼</span>
          </div>
          <div className="app-text">
            <h3>HEAVY SARAFI</h3>
            <p>Add to your home screen for quick and offline access</p>
          </div>
        </div>

        <div className="install-prompt-actions">
          {isIos ? (
            <div className="ios-instructions">
              <span>Tap</span>
              <span className="ios-icon-box"><Share size={16} /></span>
              <span>then</span>
              <strong className="ios-action-text">Add to Home Screen</strong>
              <span className="ios-icon-box"><Plus size={16} /></span>
            </div>
          ) : (
            <button className="install-btn" onClick={handleInstallClick}>
              <Download size={16} />
              <span>Install App</span>
            </button>
          )}
          <button className="dismiss-btn" onClick={handleDismiss} aria-label="Close prompt">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
