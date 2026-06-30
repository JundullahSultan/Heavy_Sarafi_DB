// src/components/Sidebar.jsx
import React from "react";
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
} from "lucide-react";
import "./Sidebar.css";

// Map each tab to a specific icon
const iconMap = {
  Dashboard: <LayoutDashboard size={22} />,
  "Receive Hawala": <ArrowDownToLine size={22} />,
  "Send Hawala": <ArrowUpFromLine size={22} />,
  Customers: <Users size={22} />,
  Kahata: <BookOpen size={22} />,
  "All Users": <UsersRound size={22} />,
  Reports: <FileBarChart size={22} />,
  Settings: <Settings size={22} />,
};

export default function Sidebar({ activeTab, setActiveTab, navItems }) {
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
      {/* Brand area */}
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
              title={getTranslatedNavItem(item)}
            >
              <span className="icon">{iconMap[item]}</span>
              <span className="label">{getTranslatedNavItem(item)}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
