import React, { useMemo, useState, useEffect } from "react";
import "./Reports.css";
import { getRole, ROLES } from "../utils/auth";
import CustomCalendar from "../components/CustomCalendar";
import CustomDropdown from "../components/CustomDropdown";
import { useLanguage } from "../context/LanguageContext";
import API from "../utils/api";

function formatDateInput(date) {
  const d = new Date(date);
  return d.toISOString().slice(0, 10);
}

// Helper: render currency badges
const CurrencyBadges = ({ dataObj }) => {
  if (!dataObj || Object.keys(dataObj).length === 0) return <span>-</span>;
  return (
    <div className="currency-badge-group">
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

export default function Reports({ user }) {
  const { t } = useLanguage();
  const currentUserRole = getRole() || ROLES.EMPLOYEE;
  const userBranch = user?.branch || "Kabul Branch";

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Default date range spans the last 5 days so all data is visible
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const [fromDate, setFromDate] = useState(formatDateInput(fiveDaysAgo));
  const [toDate, setToDate] = useState(formatDateInput(new Date()));
  const [currencyFilter, setCurrencyFilter] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      const cacheKey = `cache_reports_hawalas`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setTransactions(JSON.parse(cached));
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        setError("");
        const res = await API.get("/hawalas");
        const mapped = res.data.map(h => ({
          id: h.id,
          date: h.date && h.date.includes("T") ? h.date : new Date(h.createdAt || h.date).toISOString(),
          branch: h.type === "sent" ? h.senderBranch : h.destinationBranch,
          type: h.type,
          amount: h.amount,
          currency: h.currency,
          fee: h.fee || 0,
          status: h.status === "Paid Out" ? "paid" : "pending",
          kahataDelta: h.fundingSource === "kahata" ? h.amount : 0,
          exchangeMargin: 0,
        }));
        setTransactions(mapped);
        localStorage.setItem(cacheKey, JSON.stringify(mapped));
      } catch (err) {
        console.error("Failed to fetch reports:", err);
        setError("Failed to load report data from the backend.");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

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

  if (loading) {
    return (
      <div className="empty-state flex-center" style={{ height: "60vh" }}>
        <div className="loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state flex-column flex-center gap-1" style={{ height: "60vh" }}>
        <h3 className="text-danger">⚠️ {error}</h3>
        <button className="action-btn" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="list-container">
      {/* --- HEADER --- */}
      <div className="list-header">
        <div className="filters no-print">
          <div className="filter-group">
            <label>{t("startDate")}</label>
            <CustomCalendar
              value={fromDate}
              onChange={setFromDate}
              label={t("startDate")}
            />
          </div>
          <div className="filter-group">
            <label>{t("endDate")}</label>
            <CustomCalendar
              value={toDate}
              onChange={setToDate}
              label={t("endDate")}
            />
          </div>
          <div className="filter-group">
            <label>{t("currency")}</label>
            <CustomDropdown
              options={[
                { value: "", label: t("allCurrencies") },
                { value: "AFN", label: t("currency_AFN") },
                { value: "USD", label: t("currency_USD") },
                { value: "PKR", label: t("currency_PKR") },
                { value: "EUR", label: t("currency_EUR") },
                { value: "CNY", label: t("currency_CNY") },
                { value: "IRR", label: t("currency_IRR") },
                { value: "GBP", label: t("currency_GBP") }
              ]}
              value={currencyFilter}
              onChange={setCurrencyFilter}
              variant="6"
            />
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
                      <tr key={tx.id} className="responsive-table-row">
                        <td className="fw-bold text-light">
                          {tx.id}
                        </td>
                        <td>
                          <span className="mobile-label">{t("time")}: </span>
                          {tx.date.split("T")[1].substring(0, 5)}
                        </td>
                        <td className="text-capitalize">
                          <span className="mobile-label">{t("type")}: </span>
                          {t(tx.type)}
                        </td>
                        <td className="fw-bold">
                          <span className="mobile-label">{t("amount")}: </span>
                          {tx.amount.toLocaleString()} {tx.currency}
                        </td>
                        <td className="text-success">
                          <span className="mobile-label">{t("feeCollected")}: </span>
                          +{tx.fee} {tx.currency}
                        </td>
                        <td>
                          <span className="mobile-label">{t("status")}: </span>
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
                      <tr key={b} className="responsive-table-row">
                        <td className="fw-bold cell-branch-name">
                          {b}
                        </td>
                        <td>
                          <span className="mobile-label">
                            {t("totalCapitalSent")}:{" "}
                          </span>
                          <CurrencyBadges dataObj={branchSummary[b].sent} />
                        </td>
                        <td>
                          <span className="mobile-label">
                            {t("totalCapitalReceived")}:{" "}
                          </span>
                          <CurrencyBadges dataObj={branchSummary[b].received} />
                        </td>
                        <td>
                          <span className="mobile-label">
                            {t("commissionCollected")}:{" "}
                          </span>
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