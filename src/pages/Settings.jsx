import React, { useState } from "react";
import "./Settings.css";
import { getRole, ROLES } from "../utils/auth";
import { useLanguage } from "../context/LanguageContext";
import { usePopup } from "../context/PopupContext";
import { LogOut } from "lucide-react";

export default function Settings({ isDarkMode, setIsDarkMode, onLogout }) {
  // receive props
  const currentUserRole = getRole();
  const { showAlert, showToast } = usePopup();

  // Profile state
  const [profilePic, setProfilePic] = useState(
    "https://placehold.co/150x150/0ea5e9/ffffff?text=J",
  );
  const [fullName, setFullName] = useState("Jundullah");
  const [role, setRole] = useState(currentUserRole);

  const { language, setLanguage, t } = useLanguage();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfilePic(imageUrl);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    showToast(`${t("settingsSaved")} ${t("newRole")} ${role}`, { severity: "success" });
  };

  // Handler for theme change
  const handleThemeChange = (themeValue) => {
    setIsDarkMode(themeValue === "dark");
  };

  return (
    <div className="list-container">
      {/* Header removed */}

      <div className="settings-layout">
        {/* Left profile sidebar */}
        <div className="settings-sidebar">
          <div className="profile-card">
            <div className="profile-image-container">
              <img
                src={profilePic}
                alt={t("userProfile")}
                className="profile-image"
              />
              <label className="upload-overlay">
                <span>{t("changePhoto")}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>
            <h3 className="profile-name">{fullName}</h3>
            <span className="status-badge paid role-badge">{role}</span>
            <button
              type="button"
              className="action-btn danger settings-logout-btn"
              onClick={onLogout}
              style={{
                marginTop: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                width: "100%",
              }}
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Right form */}
        <div className="settings-main">
          <form className="settings-form" onSubmit={handleSaveSettings}>
            {/* Personal Information */}

            {/* Application Preferences */}
            <div className="settings-section">
              <h4 className="settings-section-title">
                {t("applicationPreferences")}
              </h4>
              <div className="form-grid-2">
                <div className="form-input-group">
                  <label>{t("systemLanguage")}</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="en">{t("english")}</option>
                    <option value="ps">{t("pashto")}</option>
                    <option value="da">{t("dari")}</option>
                  </select>
                </div>

                <div className="form-input-group">
                  <label>{t("visualTheme")}</label>
                  <div className="theme-toggle-group">
                    <label
                      className={`theme-btn ${!isDarkMode ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={!isDarkMode}
                        onChange={() => handleThemeChange("light")}
                        style={{ display: "none" }}
                      />
                      {t("lightMode")}
                    </label>
                    <label
                      className={`theme-btn ${isDarkMode ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={isDarkMode}
                        onChange={() => handleThemeChange("dark")}
                        style={{ display: "none" }}
                      />
                      {t("darkMode")}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
