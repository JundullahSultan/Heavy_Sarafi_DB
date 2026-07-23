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
import ExchangeList from "./pages/ExchangeList";
import { getRole, ROLES } from "./utils/auth";
import { useLanguage } from "./context/LanguageContext";
import API from "./utils/api";
import { Menu } from "lucide-react";
import InstallPrompt from "./components/InstallPrompt";
import "./App.css";

// Route definitions mapped to nav item keys
const ROUTE_MAP = {
  "Receive Hawala": "/receive-hawala",
  "Send Hawala": "/send-hawala",
  Expenses: "/expenses",
  Customers: "/customers",
  Kahata: "/kahata",
  "Sarafi Vault": "/sarafi-vault",
  "Currency Exchange": "/currency-exchange",
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
    "Currency Exchange",
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

  // --- Mobile Sidebar ---
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // --- Swipe Gesture for Mobile Sidebar ---
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    const swipeThreshold = 60; // minimum distance to swipe
    const edgeThreshold = 40;  // must start near left screen edge to open

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Check if horizontal swipe and surpasses threshold
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0) {
          // Swiped right (Left-to-Right)
          if (!isMobileSidebarOpen && touchStartX < edgeThreshold) {
            setIsMobileSidebarOpen(true);
          }
        } else {
          // Swiped left (Right-to-Left)
          if (isMobileSidebarOpen) {
            setIsMobileSidebarOpen(false);
          }
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobileSidebarOpen]);

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
      if (typeof window !== "undefined" && localStorage.getItem("isGuest") === "true") {
        const guestRole = localStorage.getItem("userRole") || "owner";
        const guestBranch = localStorage.getItem("userBranch") || "Kabul Branch";
        setUser({
          id: "guest-user",
          username: "guest",
          name: "Guest Demo User",
          role: guestRole,
          branch: guestBranch,
          isGuest: true
        });
        setCurrentUserRole(guestRole);
        setIsAuthenticated(true);
        setLoadingSession(false);
        return;
      }

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
      if (localStorage.getItem("isGuest") !== "true") {
        await API.post("/auth/logout");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("isGuest");
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

  const isGuestMode = localStorage.getItem("isGuest") === "true";

  return (
    <div className="app-layout">
      <Sidebar
        navItems={navItems}
        routeMap={ROUTE_MAP}
        onLogout={handleLogout}
        user={user}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <InstallPrompt />

      <main className="main-content">
        {/* --- Top Header --- */}
        <header className="top-header">
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <div className="header-actions">
            {isGuestMode && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "rgba(56, 189, 248, 0.12)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                color: "#38bdf8",
                padding: "0.35rem 0.85rem",
                borderRadius: "20px",
                fontSize: "0.78rem",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(56, 189, 248, 0.15)"
              }}>
                ✨ Guest Sandbox Mode (Offline)
              </div>
            )}
          </div>
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
          <Route path="/currency-exchange" element={<ExchangeList />} />

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
