// src/components/Sidebar.jsx
import React from "react";
import { useLanguage } from "../context/LanguageContext";
import "./Sidebar.css";

export default function Sidebar({
  activeTab,
  setActiveTab,
  navItems,
  setRoleForDemo,
}) {
  const { t } = useLanguage();

  const getTranslatedNavItem = (item) => {
    const labels = {
      Dashboard: t("dashboard"),
      "Receive Hawala": t("receiveHawala"),
      "Send Hawala": t("sendHawala"),
      Customers: t("customers"),
      Kahata: t("kahata"),
      "All Users": t("allUsers"),
      Reports: t("reports"),
      Settings: t("settings"),
    };
    return labels[item] || item;
  };

  return (
    <nav className="sidebar">
      {/* Brand area – now just a subtle visual mark (no text) */}
      <div className="brand" aria-hidden="true"></div>

      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item}>
            <a
              href="#"
              className={activeTab === item ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(item);
              }}
            >
              {getTranslatedNavItem(item)}
            </a>
          </li>
        ))}
      </ul>

      {/* DEMO_ONLY role switcher */}
      <div className="demo-role-switcher">
        <h4>{t("switchRoleDemo")}</h4>
        <button onClick={() => setRoleForDemo("owner")}>{t("owner")}</button>
        <button onClick={() => setRoleForDemo("manager")}>
          {t("manager")}
        </button>
        <button onClick={() => setRoleForDemo("employee")}>
          {t("employee")}
        </button>
      </div>
    </nav>
  );
}
