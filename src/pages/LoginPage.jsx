import React, { useState } from "react";
import API from "../utils/api";
import { usePopup } from "../context/PopupContext";
import { Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import "./LoginPage.css";

export default function LoginPage({ onLoginSuccess }) {
  const { showAlert, showToast } = usePopup();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("Kabul Branch");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        // Register new staff user (role: manager by default)
        const payload = {
          username: username.trim(),
          password,
          name: name.trim(),
          branch,
          role: "manager", // manager by default as per requirements
          phone: "",
        };
        const res = await API.post("/auth/register", payload);
        showToast("Registration successful! Please login.", { severity: "success" });
        setIsRegister(false);
        setPassword("");
      } else {
        // Login user
        const res = await API.post("/auth/login", {
          username: username.trim(),
          password,
          branch, // optional, login verifies credentials
        });
        onLoginSuccess(res.data);
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError(
        err.response?.data?.message ||
          "Authentication failed. Please verify credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    localStorage.setItem("isGuest", "true");
    localStorage.setItem("userRole", "owner");
    localStorage.setItem("userBranch", "Kabul Branch");
    showToast("Welcome to Guest Sandbox Demo!", { severity: "info" });
    onLoginSuccess({
      id: "guest-user",
      username: "guest",
      name: "Guest Demo User",
      role: "owner",
      branch: "Kabul Branch",
      isGuest: true
    });
  };

  return (
    <div className="login-page-container">
      <div className="login-glass-card">
        <div className="login-header">
          <div className="logo-area">
            <span className="logo-icon">💼</span>
            <h2>HEAVY SARAFI</h2>
          </div>
          <p className="subtitle">Branch Ledger & Hawala Management System</p>
        </div>

        <div className="tab-control">
          <button
            className={`tab-btn ${!isRegister ? "active" : ""}`}
            onClick={() => {
              setIsRegister(false);
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            className={`tab-btn ${isRegister ? "active" : ""}`}
            onClick={() => {
              setIsRegister(true);
              setError("");
            }}
          >
            Register Staff
          </button>
        </div>

        {error && <div className="error-message-box">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Active Branch</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="Kabul Branch">Kabul Branch</option>
              <option value="Herat Main">Herat Main</option>
              <option value="Dubai Branch">Dubai Branch</option>
              <option value="Mazar Branch">Mazar Branch</option>
            </select>
          </div>

          {isRegister && (
            <div className="form-group">
              <label>Assigned Role</label>
              <input type="text" value="Manager (Default)" readOnly disabled />
            </div>
          )}

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "Processing..." : isRegister ? "Register" : "Sign In"}
          </button>
        </form>

        <div className="login-divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="guest-login-btn"
          onClick={handleGuestLogin}
        >
          <div className="guest-btn-content">
            <div className="guest-icon-badge">
              <Sparkles size={18} />
            </div>
            <div className="guest-text-group">
              <span className="guest-title">Continue as Guest</span>
              <span className="guest-subtitle">Try instant demo without server connection</span>
            </div>
          </div>
          <ArrowRight size={18} className="guest-arrow" />
        </button>
      </div>
    </div>
  );
}
