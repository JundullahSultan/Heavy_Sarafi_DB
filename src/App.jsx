// src/App.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import CustomerList from "./pages/CustomerList";
import ReceiveHawala from "./pages/ReceivedHawalaList";
import SendHawala from "./pages/SendHawalaList";
import KahataList from "./pages/KahataList";
import Settings from "./pages/Settings";
import AllUsers from "./pages/AllUsers";
import Reports from "./pages/Reports";
import { getRole, setRole, ROLES } from "./utils/auth";
import { useLanguage } from "./context/LanguageContext";
import "./App.css";

const getDefaultTabForRole = (role) => {
  if (role === ROLES.OWNER || role === ROLES.MANAGER) {
    return "Reports";
  }
  return "Receive Hawala";
};

const getNavItemsForRole = (role) => {
  const baseItems = ["Receive Hawala", "Send Hawala", "Customers", "Kahata"];
  switch (role) {
    case ROLES.OWNER:
      return [...baseItems, "All Users", "Reports", "Settings"];
    case ROLES.MANAGER:
      return [...baseItems, "Reports", "Settings"];
    case ROLES.EMPLOYEE:
      return [...baseItems, "Settings"];
    default:
      return ["Settings"];
  }
};

function App() {
  const { t } = useLanguage();

  // --- Role & Navigation ---
  const [currentUserRole, setCurrentUserRole] = useState(getRole());
  const [navItems, setNavItems] = useState([]);
  const [activeTab, setActiveTab] = useState(() =>
    getDefaultTabForRole(getRole()),
  );

  // --- Dark Mode ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const stored = localStorage.getItem("darkMode");
    if (stored !== null) {
      return stored === "true";
    }
    // Fallback to system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Apply dark mode class to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Listen for system theme changes (if user hasn't manually set)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      // Only update if user hasn't made a manual choice (no localStorage)
      if (localStorage.getItem("darkMode") === null) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // --- Role handling ---
  useEffect(() => {
    const items = getNavItemsForRole(currentUserRole);
    setNavItems(items);
    if (!items.includes(activeTab)) {
      setActiveTab(items[0] || "Settings");
    }
  }, [currentUserRole, activeTab]);

  const handleSetRole = (role) => {
    setRole(role);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className="app-layout" dir="ltr">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={navItems}
        // Removed setRoleForDemo from here
      />

      <main className="main-content">
        {/* --- Top Header (now visible) --- */}
        <header className="top-header">
          <div className="header-actions">
            {/* Relocated DEMO_ONLY role switcher */}
            <div className="demo-role-switcher header-role-switcher">
              <button onClick={() => handleSetRole("owner")}>
                {t("owner") || "Owner"}
              </button>
              <button onClick={() => handleSetRole("manager")}>
                {t("manager") || "Manager"}
              </button>
              <button onClick={() => handleSetRole("employee")}>
                {t("employee") || "Employee"}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        {activeTab === "Receive Hawala" && <ReceiveHawala />}
        {activeTab === "Send Hawala" && <SendHawala />}
        {activeTab === "Customers" && <CustomerList />}
        {activeTab === "Kahata" && <KahataList />}

        {activeTab === "All Users" && currentUserRole === ROLES.OWNER && (
          <AllUsers />
        )}
        {activeTab === "Reports" &&
          (currentUserRole === ROLES.OWNER ||
            currentUserRole === ROLES.MANAGER) && <Reports />}

        {activeTab === "Settings" && (
          <Settings isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        )}
      </main>
    </div>
  );
}

export default App;
