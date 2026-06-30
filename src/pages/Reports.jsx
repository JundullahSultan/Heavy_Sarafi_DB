import React, { useMemo, useState } from "react";
import "./Reports.css";
import { getRole, ROLES } from "../utils/auth";
import { useLanguage } from "../context/LanguageContext";

// Expanded Mock Data
const SAMPLE_TX = [
  {
    id: "SHW-5011",
    date: "2026-06-29T09:00:00",
    branch: "Herat Main",
    type: "sent",
    amount: 15000,
    currency: "AFN",
    fee: 150,
    status: "pending",
    kahataDelta: 0,
    exchangeMargin: 0,
  },
  {
    id: "SHW-5012",
    date: "2026-06-29T10:45:00",
    branch: "Dubai Branch",
    type: "sent",
    amount: 5000,
    currency: "USD",
    fee: 25,
    status: "paid",
    kahataDelta: 0,
    exchangeMargin: 12,
  },
  {
    id: "RHW-3001",
    date: "2026-06-29T11:05:00",
    branch: "Kabul Branch",
    type: "received",
    amount: 10000,
    currency: "AFN",
    fee: 100,
    status: "paid",
    kahataDelta: 0,
    exchangeMargin: 0,
  },
  {
    id: "SHW-5013",
    date: "2026-06-29T14:20:00",
    branch: "Kabul Branch",
    type: "sent",
    amount: 2000,
    currency: "USD",
    fee: 15,
    status: "paid",
    kahataDelta: 0,
    exchangeMargin: 5,
  },
];

function formatDateInput(date) {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

// Helper: render currency badges
const CurrencyBadges = ({ dataObj }) => {
  if (!dataObj || Object.keys(dataObj).length === 0) return <span>-</span>;
  return (
    <div
      className="currency-badge-group"
      style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}
    >
      {Object.entries(dataObj).map(([currency, amount]) => (
        <span
          key={currency}
          className={`currency-badge ${amount >= 0 ? "positive" : "negative"}`}
        >
          {amount.toLocaleString()} {currency}
        </span>
      ))}
    </div>
  );
};

export default function Reports() {
  const { t } = useLanguage();
  const currentUserRole = getRole() || ROLES.EMPLOYEE;
  const userBranch = "Kabul Branch"; // Hardcoded for demo

  const [fromDate, setFromDate] = useState(formatDateInput(new Date()));
  const [toDate, setToDate] = useState(formatDateInput(new Date()));
  const [currencyFilter, setCurrencyFilter] = useState("");

  const transactions = useMemo(() => SAMPLE_TX, []);

  // Filter logic
  const filtered = useMemo(() => {
    const from = new Date(fromDate + "T00:00:00");
    const to = new Date(toDate + "T23:59:59");
    return transactions.filter((t) => {
      const d = new Date(t.date);
      if (d < from || d > to) return false;
      if (currencyFilter && t.currency !== currencyFilter) return false;
      if (currentUserRole === ROLES.MANAGER && t.branch !== userBranch)
        return false;
      return true;
    });
  }, [
    transactions,
    fromDate,
    toDate,
    currencyFilter,
    currentUserRole,
    userBranch,
  ]);

  // Aggregations
  const aggregateByCurrency = (items, key = "amount") => {
    return items.reduce((acc, t) => {
      acc[t.currency] = (acc[t.currency] || 0) + (t[key] || 0);
      return acc;
    }, {});
  };

  const sentByCurrency = aggregateByCurrency(
    filtered.filter((t) => t.type === "sent"),
    "amount",
  );
  const receivedByCurrency = aggregateByCurrency(
    filtered.filter((t) => t.type === "received"),
    "amount",
  );
  const commissionByCurrency = aggregateByCurrency(filtered, "fee");
  const exchangeMarginByCurrency = aggregateByCurrency(
    filtered,
    "exchangeMargin",
  );

  const totalHawalasCount = filtered.length;
  const pendingCount = filtered.filter((t) => t.status !== "paid").length;

  // Branch breakdown (Owner)
  const branchSummary = filtered.reduce((acc, t) => {
    if (!acc[t.branch]) {
      acc[t.branch] = { sent: {}, received: {}, commission: {} };
    }
    const bucket =
      t.type === "sent" ? acc[t.branch].sent : acc[t.branch].received;
    bucket[t.currency] = (bucket[t.currency] || 0) + t.amount;
    acc[t.branch].commission[t.currency] =
      (acc[t.branch].commission[t.currency] || 0) + (t.fee || 0);
    return acc;
  }, {});

  const downloadCSV = () => {
    const headers = [
      "ID",
      "Date",
      "Branch",
      "Type",
      "Amount",
      "Currency",
      "Fee",
      "Status",
    ];
    const rows = filtered.map((t) => [
      t.id,
      t.date.split("T").join(" "),
      t.branch,
      t.type,
      t.amount,
      t.currency,
      t.fee,
      t.status,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Sarafi_Report_${fromDate}_to_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="list-container">
      {/* --- HEADER --- */}
      <div className="list-header">
        <div>
          <h2 className="section-title">
            {currentUserRole === ROLES.OWNER
              ? t("globalFinancialReport")
              : `${userBranch} ${t("branchEodReport")}`}
          </h2>
          <span className="role-badge">
            {t("accessLevel")}: {currentUserRole}
          </span>
        </div>

        <div className="filters no-print">
          <div className="filter-group">
            <label>{t("startDate")}</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>{t("endDate")}</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>{t("currency")}</label>
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
            >
              <option value="">{t("allCurrencies")}</option>
              <option value="AFN">Afghani (AFN)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="PKR">Pakistani Rupee (PKR)</option>
            </select>
          </div>
          <div className="filter-actions">
            <button
              className="action-btn secondary auto-width"
              onClick={downloadCSV}
            >
              📥 CSV
            </button>
            <button
              className="action-btn auto-width"
              onClick={() => window.print()}
            >
              🖨️ Print
            </button>
          </div>
        </div>
      </div>

      {/* --- MANAGER VIEW --- */}
      {currentUserRole === ROLES.MANAGER && (
        <>
          {/* Summary Cards */}
          <div className="summary-grid">
            <div className="summary-card">
              <div className="card-title">{t("volumeSentOut")}</div>
              <CurrencyBadges dataObj={sentByCurrency} />
            </div>
            <div className="summary-card">
              <div className="card-title">{t("volumeReceivedPaid")}</div>
              <CurrencyBadges dataObj={receivedByCurrency} />
            </div>
            <div className="summary-card">
              <div className="card-title">{t("branchCommission")}</div>
              <CurrencyBadges dataObj={commissionByCurrency} />
            </div>
            <div className="summary-card">
              <div className="card-title">{t("pendingActionRequired")}</div>
              <div className="card-value text-danger">
                {pendingCount} {t("hawalas")}
              </div>
            </div>
          </div>

          {/* Transaction Log */}
          <div>
            <h3 className="section-subtitle">{t("dailyTransactionLog")}</h3>
            <div className="table-wrapper">
              <table className="hawala-table">
                <thead>
                  <tr>
                    <th>{t("hawalaId")}</th>
                    <th>{t("time")}</th>
                    <th>{t("type")}</th>
                    <th>{t("amount")}</th>
                    <th>{t("feeCollected")}</th>
                    <th>{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map((tx) => (
                      <tr key={tx.id}>
                        <td className="fw-bold text-light">{tx.id}</td>
                        <td>{tx.date.split("T")[1].substring(0, 5)}</td>
                        <td style={{ textTransform: "capitalize" }}>
                          {tx.type}
                        </td>
                        <td className="fw-bold">
                          {tx.amount.toLocaleString()} {tx.currency}
                        </td>
                        <td className="text-success">
                          +{tx.fee} {tx.currency}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${tx.status === "paid" ? "paid" : "pending"}`}
                          >
                            {tx.status === "paid"
                              ? t("paidOutStatus")
                              : t("pendingPayoutStatus")}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">
                        {t("noTransactionsFound")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- OWNER VIEW --- */}
      {currentUserRole === ROLES.OWNER && (
        <>
          {/* Profitability Highlights */}
          <div className="profit-grid">
            <div className="profit-card green">
              <div className="card-title">{t("totalGrossCommission")}</div>
              <div className="card-value">
                <CurrencyBadges dataObj={commissionByCurrency} />
              </div>
              <div className="footnote">{t("derivedStrictlyFromFees")}</div>
            </div>
            <div className="profit-card yellow">
              <div className="card-title">{t("estimatedExchangeMargins")}</div>
              <div className="card-value">
                <CurrencyBadges dataObj={exchangeMarginByCurrency} />
              </div>
              <div className="footnote">
                {t("profitFromCurrencyConversions")}
              </div>
            </div>
          </div>

          {/* Branch Breakdown */}
          <div>
            <h3 className="section-subtitle">
              {t("branchPerformanceComparison")}
            </h3>
            <div className="table-wrapper">
              <table className="hawala-table">
                <thead>
                  <tr>
                    <th>{t("branchLocation")}</th>
                    <th>{t("totalCapitalSent")}</th>
                    <th>{t("totalCapitalReceived")}</th>
                    <th>{t("commissionCollected")}</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(branchSummary).length > 0 ? (
                    Object.keys(branchSummary).map((b) => (
                      <tr key={b}>
                        <td className="fw-bold">{b}</td>
                        <td>
                          <CurrencyBadges dataObj={branchSummary[b].sent} />
                        </td>
                        <td>
                          <CurrencyBadges dataObj={branchSummary[b].received} />
                        </td>
                        <td>
                          <CurrencyBadges
                            dataObj={branchSummary[b].commission}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-data">
                        {t("noBranchData")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- Audit Footer --- */}
      <div className="audit-footer no-print">
        <div>
          {t("generatedBy")}: <strong>{currentUserRole.toUpperCase()}</strong>
        </div>
        <div>
          {t("timestamp")}: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}
