// src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  BookOpen,
  UsersRound,
  FileBarChart,
  Settings,
  Wallet,
  LogOut,
  ShieldCheck,
  X,
  RefreshCw,
} from "lucide-react";
import "./Sidebar.css";

// Map each tab to a specific icon
const iconMap = {
  "Receive Hawala": <ArrowDownToLine size={22} />,
  "Send Hawala": <ArrowUpFromLine size={22} />,
  Customers: <Users size={22} />,
  Kahata: <BookOpen size={22} />,
  "Sarafi Vault": <ShieldCheck size={22} />,
  "Currency Exchange": <RefreshCw size={22} />,
  "All Users": <UsersRound size={22} />,
  Reports: <FileBarChart size={22} />,
  Expenses: <Wallet size={22} />,
  Settings: <Settings size={22} />,
};

export default function Sidebar({ navItems, routeMap, onLogout, user, isMobileOpen, onMobileClose }) {
  const { t } = useLanguage();

  const getTranslatedNavItem = (item) => {
    const labels = {
      "Receive Hawala": t("receiveHawala"),
      "Send Hawala": t("sendHawala"),
      Customers: t("customers"),
      Kahata: t("kahata"),
      "Sarafi Vault": t("sarafiVault"),
      "Currency Exchange": t("currencyExchange"),
      "All Users": t("allUsers"),
      Reports: t("reports"),
      Expenses: t("expenses"),
      Settings: t("settings"),
    };
    return labels[item] || item;
  };

  return (
    <>
      {/* Dark overlay behind the drawer on mobile */}
      <div
        className={`sidebar-overlay ${isMobileOpen ? "visible" : ""}`}
        onClick={onMobileClose}
      />

      <nav className={`sidebar ${isMobileOpen ? "mobile-open" : ""}`}>
        {/* Brand area */}
        <div className="brand" aria-hidden="true">
          <span className="logo-icon">💼</span>
          <span className="brand-text">HEAVY SARAFI</span>
          {/* Close button visible only on mobile */}
          <button className="sidebar-close-btn" onClick={onMobileClose} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        {user && (
          <div className="sidebar-profile">
            <div className="profile-info">
              <span className="profile-name">{user.name}</span>
              <span className="profile-role">{user.role?.toUpperCase()}</span>
              <span className="profile-branch">{user.branch}</span>
            </div>
          </div>
        )}

        <ul className="nav-links">
          {navItems.map((item) => (
            <li key={item}>
              <NavLink
                to={routeMap[item] || "/"}
                className={({ isActive }) => (isActive ? "active" : "")}
                title={getTranslatedNavItem(item)}
                onClick={onMobileClose}
              >
                <span className="icon">{iconMap[item]}</span>
                <span className="label">{getTranslatedNavItem(item)}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Logout button removed from navigation */}
      </nav>
    </>
  );
}
