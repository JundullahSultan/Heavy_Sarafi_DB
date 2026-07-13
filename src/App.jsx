// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import CustomerList from "./pages/CustomerList";
import ReceiveHawala from "./pages/ReceivedHawalaList";
import SendHawala from "./pages/SendHawalaList";
import KahataList from "./pages/KahataList";
import Settings from "./pages/Settings";
import AllUsers from "./pages/AllUsers";
import Reports from "./pages/Reports";
import Expenses from "./pages/Expenses";
import LoginPage from "./pages/LoginPage";
import SarafiVault from "./pages/SarafiVault";
import { getRole, ROLES } from "./utils/auth";
import { useLanguage } from "./context/LanguageContext";
import API from "./utils/api";
import "./App.css";

// Route definitions mapped to nav item keys
const ROUTE_MAP = {
  "Receive Hawala": "/receive-hawala",
  "Send Hawala": "/send-hawala",
  Expenses: "/expenses",
  Customers: "/customers",
  Kahata: "/kahata",
  "Sarafi Vault": "/sarafi-vault",
  "All Users": "/all-users",
  Reports: "/reports",
  Settings: "/settings",
};

const getDefaultRouteForRole = (role) => {
  return ROUTE_MAP["Receive Hawala"];
};

const getNavItemsForRole = (role) => {
  const baseItems = [
    "Receive Hawala",
    "Send Hawala",
    "Expenses",
    "Customers",
    "Kahata",
    "Sarafi Vault",
  ];
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
  const navigate = useNavigate();

  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // --- Role & Navigation ---
  const [currentUserRole, setCurrentUserRole] = useState(getRole());
  const [navItems, setNavItems] = useState(() =>
    getNavItemsForRole(getRole())
  );

  // --- Dark Mode ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    if (stored !== null) {
      return stored === "true";
    }
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

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      if (localStorage.getItem("darkMode") === null) {
        setIsDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // --- Authenticate user session on mount ---
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data);
        setCurrentUserRole(res.data.role);
        localStorage.setItem("userRole", res.data.role);
        localStorage.setItem("userBranch", res.data.branch);
        setIsAuthenticated(true);
      } catch (err) {
        console.log("No active session or session expired.");
        setIsAuthenticated(false);
        setUser(null);
        setCurrentUserRole(null);
        localStorage.removeItem("userRole");
        localStorage.removeItem("userBranch");
      } finally {
        setLoadingSession(false);
      }
    };
    checkSession();
  }, []);

  // --- Role handling ---
  useEffect(() => {
    const items = getNavItemsForRole(currentUserRole);
    setNavItems(items);
  }, [currentUserRole]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentUserRole(userData.role);
    localStorage.setItem("userRole", userData.role);
    localStorage.setItem("userBranch", userData.branch);
    setIsAuthenticated(true);
    navigate(getDefaultRouteForRole(userData.role));
  };

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setCurrentUserRole(null);
      localStorage.removeItem("userRole");
      localStorage.removeItem("userBranch");
      navigate("/");
    }
  };

  const defaultRoute = getDefaultRouteForRole(currentUserRole);

  if (loadingSession) {
    return (
      <div className="empty-state" style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="loader"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        navItems={navItems}
        routeMap={ROUTE_MAP}
        onLogout={handleLogout}
        user={user}
      />

      <main className="main-content">
        {/* --- Top Header --- */}
        <header className="top-header">
          <div className="header-actions"></div>
        </header>

        {/* Page Content via Routes */}
        <Routes>
          <Route path="/receive-hawala" element={<ReceiveHawala />} />
          <Route path="/receive-hawala/:id" element={<ReceiveHawala />} />
          <Route path="/send-hawala" element={<SendHawala />} />
          <Route path="/send-hawala/:id" element={<SendHawala />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/expenses/:id" element={<Expenses />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerList />} />
          <Route path="/kahata" element={<KahataList />} />
          <Route path="/kahata/:id" element={<KahataList />} />
          <Route path="/sarafi-vault" element={<SarafiVault />} />

          {/* Protected: Owner only */}
          <Route
            path="/all-users"
            element={
              currentUserRole === ROLES.OWNER ? (
                <AllUsers />
              ) : (
                <Navigate to={defaultRoute} replace />
              )
            }
          />

          {/* Protected: Owner or Manager */}
          <Route
            path="/reports"
            element={
              currentUserRole === ROLES.OWNER ||
              currentUserRole === ROLES.MANAGER ? (
                <Reports user={user} />
              ) : (
                <Navigate to={defaultRoute} replace />
              )
            }
          />

          <Route
            path="/settings"
            element={
              <Settings
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                onLogout={handleLogout}
              />
            }
          />

          {/* Default redirect: root goes to role-based default */}
          <Route path="/" element={<Navigate to={defaultRoute} replace />} />

          {/* Catch-all: redirect unknown routes */}
          <Route path="*" element={<Navigate to={defaultRoute} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
