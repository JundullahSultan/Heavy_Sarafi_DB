// src/pages/Dashboard.jsx
import React from "react";
import { getRole, ROLES } from "../utils/auth";
import { useLanguage } from "../context/LanguageContext";
import "./Dashboard.css";

export default function Dashboard() {
  const { t } = useLanguage();
  const role = getRole() || ROLES.EMPLOYEE;

  // Hardcoded for demonstration. In a real app, these come from an API.
  const userBranch = "Kabul Branch";

  // --- EMPLOYEE VIEW ---
  if (role === ROLES.EMPLOYEE) {
    return (
      <div className="content-area">
        <h2 className="section-title">{t("operationalDashboard")}</h2>

        <div className="grid action-grid">
          <div className="card">
            <h3>{t("newIncomingHawala")}</h3>
            <p className="text-light">{t("processMoneySent")}</p>
            <button className="action-btn">{t("createReceivedHawala")}</button>
          </div>

          <div className="card">
            <h3>{t("sendMoney")}</h3>
            <p className="text-light">{t("draftNewHawala")}</p>
            <button className="action-btn secondary">
              {t("createSentHawala")}
            </button>
          </div>

          <div className="card alert-card">
            <h3>{t("needsAttention")}</h3>
            <div className="value text-danger">4</div>
            <p className="text-light">{t("hawalasWaiting")}</p>
            <button className="action-btn danger">{t("viewQueue")}</button>
          </div>
        </div>
      </div>
    );
  }

  // --- MANAGER VIEW ---
  if (role === ROLES.MANAGER) {
    return (
      <div className="content-area">
        <div className="dashboard-header">
          <div>
            <h2 className="section-title" style={{ marginBottom: "0.25rem" }}>
              {userBranch} {t("overview")}
            </h2>
            <span className="status-badge paid">{t("managerAccess")}</span>
          </div>
          <div className="date-display">{new Date().toDateString()}</div>
        </div>

        {/* Manager Key Metrics */}
        <div className="grid stats-grid">
          <div className="card metric-card">
            <h3>{t("safeBalanceMasterTill")}</h3>
            <div className="value text-success">4,250,000 AFN</div>
            <p className="trend positive">↑ {t("physicalCashOnHand")}</p>
          </div>
          <div className="card metric-card">
            <h3>{t("todaysSentVolume")}</h3>
            <div className="value">850,000 AFN</div>
            <p className="trend neutral">{t("across12Transactions")}</p>
          </div>
          <div className="card metric-card">
            <h3>{t("todaysPayoutVolume")}</h3>
            <div className="value">320,000 AFN</div>
            <p className="trend neutral">{t("across5Transactions")}</p>
          </div>
          <div className="card metric-card alert-card">
            <h3>{t("pendingBranchPayouts")}</h3>
            <div className="value text-danger">8</div>
            <p className="trend negative">{t("requiresImmediateAction")}</p>
          </div>
        </div>

        <h3 className="section-title mt-4">{t("quickActions")}</h3>
        <div className="grid action-grid">
          <div className="card">
            <h3>{t("staffManagement")}</h3>
            <p className="text-light">{t("viewOrSuspendBranchEmployees")}</p>
            <button className="action-btn secondary">{t("manageStaff")}</button>
          </div>
          <div className="card">
            <h3>{t("endOfDayReport")}</h3>
            <p className="text-light">{t("generateZReport")}</p>
            <button className="action-btn">{t("generateReport")}</button>
          </div>
        </div>
      </div>
    );
  }

  // --- OWNER VIEW ---
  return (
    <div className="content-area">
      <div className="dashboard-header">
        <div>
          <h2 className="section-title" style={{ marginBottom: "0.25rem" }}>
            {t("globalNetworkCommand")}
          </h2>
          <span
            className="status-badge"
            style={{
              backgroundColor: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
            }}
          >
            {t("superAdminOwner")}
          </span>
        </div>
        <div className="date-display">{new Date().toDateString()}</div>
      </div>

      {/* Owner Global Metrics */}
      <div className="grid stats-grid">
        <div className="card metric-card highlight-metric">
          <h3>{t("globalSystemLiquidity")}</h3>
          <div className="value text-main">$1,245,000 USD</div>
          <p className="trend positive">{t("totalCashAcrossSafes")}</p>
        </div>
        <div className="card metric-card">
          <h3>{t("todaysGlobalCommission")}</h3>
          <div className="value text-success">$1,450 USD</div>
          <p className="trend positive">↑ 12% {t("vsYesterday")}</p>
        </div>
        <div className="card metric-card">
          <h3>{t("activeBranches")}</h3>
          <div className="value">4</div>
          <p className="trend neutral">{t("branchCities")}</p>
        </div>
        <div className="card metric-card">
          <h3>{t("networkPendingPayouts")}</h3>
          <div className="value text-warning">24</div>
          <p className="trend negative">{t("acrossAllLocations")}</p>
        </div>
      </div>

      <div className="grid split-grid mt-4">
        {/* Left Side: Recent High-Value Transactions */}
        <div className="card list-card">
          <div className="card-header">
            <h3>{t("highValueTransactionsLive")}</h3>
            <button className="text-btn">{t("viewAll")}</button>
          </div>
          <div className="mini-list">
            <div className="mini-list-item">
              <div>
                <strong>SHW-5099</strong>
                <span className="text-light block">Kabul → Dubai</span>
              </div>
              <div className="text-right">
                <strong className="text-success">$50,000</strong>
                <span className="status-badge pending block mt-1">
                  {t("pendingPayoutStatus")}
                </span>
              </div>
            </div>
            <div className="mini-list-item">
              <div>
                <strong>RHW-3102</strong>
                <span className="text-light block">Mazar → Herat</span>
              </div>
              <div className="text-right">
                <strong className="text-success">2,000,000 AFN</strong>
                <span className="status-badge paid block mt-1">
                  {t("paidOutStatus")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Owner Actions */}
        <div className="grid action-grid single-col">
          <div className="card bg-gradient">
            <h3>{t("aiFinancialAssistant")}</h3>
            <p className="text-light" style={{ color: "#e2e8f0" }}>
              {t("askGeminiAnalysis")}
            </p>
            <button
              className="action-btn"
              style={{
                backgroundColor: "white",
                color: "var(--primary-color)",
              }}
            >
              ✨ {t("openAiChat")}
            </button>
          </div>
          <div className="card">
            <h3>{t("globalReporting")}</h3>
            <p className="text-light">{t("exportCrossBranchProfitability")}</p>
            <button className="action-btn secondary">{t("goToReports")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
