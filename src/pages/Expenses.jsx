import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { usePopup } from "../context/PopupContext";
import API from "../utils/api";
import "./Expenses.css";

const CURRENCIES = ["AFN", "USD", "PKR", "EUR", "CNY", "IRR", "GBP"];

const todayStr = () => new Date().toISOString().split("T")[0];

const Expenses = () => {
  const { t } = useLanguage();
  const { showAlert } = usePopup();
  const { id } = useParams();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const EXPENSE_CATEGORIES = [
    { id: "rent-utilities", label: t("catRentUtilities") },
    { id: "staff", label: t("catStaffExpenses") },
    { id: "government-legal", label: t("catGovernmentLegal") },
    { id: "operational", label: t("catOperational") },
    { id: "commissions-fees", label: t("catCommissionsFees") },
    { id: "transport", label: t("catTransportTravel") },
    { id: "miscellaneous", label: t("catMiscellaneous") },
  ];

  const getCategoryLabel = (catId) => {
    const found = EXPENSE_CATEGORIES.find((c) => c.id === catId);
    return found ? found.label : catId;
  };

  // --- Fetch Expenses with localStorage caching ---
  useEffect(() => {
    const fetchExpenses = async () => {
      const cacheKey = `cache_expenses_${filterCategory}_${searchTerm}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setExpenses(JSON.parse(cached));
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const res = await API.get(`/expenses?category=${filterCategory}&search=${searchTerm}`);
        setExpenses(res.data);
        localStorage.setItem(cacheKey, JSON.stringify(res.data));
      } catch (err) {
        console.error("Error fetching expenses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, [filterCategory, searchTerm]);

  // --- Modal states ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activePeriod, setActivePeriod] = useState(null); // "daily" | "weekly" | "monthly"

  // --- Form state for new expense ---
  const emptyForm = {
    amount: "",
    currency: "AFN",
    category: "",
    date: todayStr(),
    description: "",
    receiptFile: null,
    receiptPreview: null,
  };
  const [form, setForm] = useState({ ...emptyForm });

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setForm((prev) => ({
        ...prev,
        receiptFile: file,
        receiptPreview: preview,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.category) return;

    const formData = new FormData();
    formData.append("amount", form.amount);
    formData.append("currency", form.currency);
    formData.append("categoryId", form.category);
    formData.append("date", form.date);
    formData.append("description", form.description);
    if (form.receiptFile) {
      formData.append("receipt", form.receiptFile);
    }

    try {
      const res = await API.post("/expenses", formData);
      setExpenses((prev) => [res.data, ...prev]);
      setForm({ ...emptyForm });
      setIsAddModalOpen(false);
      showAlert("Expense recorded successfully!");
    } catch (err) {
      console.error("Error logging expense:", err);
      showAlert("Error recording expense: " + (err.response?.data?.message || err.message));
    }
  };

  const viewingExpense = id ? expenses.find((e) => e.id === id) : null;

  const formatAmount = (amount, currency) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const uniqueCategoryIds = [
    ...new Set(expenses.map((e) => e.categoryId)),
  ].sort();

  const totalsByCurrency = expenses.reduce((acc, exp) => {
    acc[exp.currency] = (acc[exp.currency] || 0) + exp.amount;
    return acc;
  }, {});

  // --- Period filtering helpers ---
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    // Saturday-based week (common in Afghanistan)
    const diff = (day + 1) % 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const filterByPeriod = (period) => {
    const now = new Date();
    const todayDate = now.toISOString().split("T")[0];

    return expenses.filter((exp) => {
      const expDate = new Date(exp.date);
      if (period === "daily") {
        return exp.date === todayDate;
      } else if (period === "weekly") {
        const weekStart = getStartOfWeek(now);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return expDate >= weekStart && expDate <= weekEnd;
      } else if (period === "monthly") {
        return (
          expDate.getFullYear() === now.getFullYear() &&
          expDate.getMonth() === now.getMonth()
        );
      }
      return true;
    });
  };

  const periodExpenses = activePeriod ? filterByPeriod(activePeriod) : [];

  const periodTotals = periodExpenses.reduce((acc, exp) => {
    acc[exp.currency] = (acc[exp.currency] || 0) + exp.amount;
    return acc;
  }, {});

  const getPeriodLabel = () => {
    const now = new Date();
    if (activePeriod === "daily") {
      return `${t("dailyExpenses")} — ${t("today")} (${now.toISOString().split("T")[0]})`;
    } else if (activePeriod === "weekly") {
      const weekStart = getStartOfWeek(now);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `${t("weeklyExpenses")} — ${t("thisWeek")} (${weekStart.toISOString().split("T")[0]} → ${weekEnd.toISOString().split("T")[0]})`;
    } else if (activePeriod === "monthly") {
      return `${t("monthlyExpenses")} — ${t("thisMonth")} (${now.toISOString().split("T")[0].slice(0, 7)})`;
    }
    return "";
  };

  const handlePeriodClick = (period) => {
    setActivePeriod(period);
    setIsReportModalOpen(true);
  };

  return (
    <div className="list-container">
      {/* --- Header --- */}
      <div className="list-header" style={{ justifyContent: "flex-end" }}>
        <button
          className="action-btn primary-btn"
          onClick={() => setIsAddModalOpen(true)}
        >
          + {t("addExpense")}
        </button>
      </div>

      {/* --- Summary Cards --- */}
      <div className="expense-summary-row">
        <div className="expense-summary-card">
          <span className="summary-label">
            {t("totalExpenses")} (AFN)
          </span>
          <span className="summary-value">
            {(totalsByCurrency["AFN"] || 0).toLocaleString()}
          </span>
        </div>
        <div className="expense-summary-card count-card">
          <span className="summary-label">
            {t("totalRecords")}
          </span>
          <span className="summary-value">{expenses.length}</span>
        </div>
      </div>

      {/* --- Period Report Buttons --- */}
      <div className="period-btns-row">
        <button
          className={`period-btn period-btn-daily${activePeriod === "daily" ? " active" : ""}`}
          onClick={() => handlePeriodClick("daily")}
        >
          <span className="period-btn-icon">📅</span>
          {t("dailyExpenses")}
        </button>
        <button
          className={`period-btn period-btn-weekly${activePeriod === "weekly" ? " active" : ""}`}
          onClick={() => handlePeriodClick("weekly")}
        >
          <span className="period-btn-icon">📆</span>
          {t("weeklyExpenses")}
        </button>
        <button
          className={`period-btn period-btn-monthly${activePeriod === "monthly" ? " active" : ""}`}
          onClick={() => handlePeriodClick("monthly")}
        >
          <span className="period-btn-icon">🗓️</span>
          {t("monthlyExpenses")}
        </button>
      </div>

      {/* --- Filters --- */}
      <div className="expense-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder={t("searchExpenses")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">
            {t("allCategories")}
          </option>
          {uniqueCategoryIds.map((catId) => (
            <option key={catId} value={catId}>
              {getCategoryLabel(catId)}
            </option>
          ))}
        </select>
      </div>

      {/* --- Table --- */}
      <div className="table-wrapper">
        {loading ? (
          <div className="empty-state" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div className="loader"></div>
          </div>
        ) : (
          <table className="hawala-table">
            <thead>
              <tr>
                <th>{t("expenseId")}</th>
                <th>{t("date")}</th>
                <th>{t("expenseCategory")}</th>
                <th>{t("amount")}</th>
                <th>{t("description")}</th>
                <th>{t("recordedBy")}</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    {t("noExpensesFound")}
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="clickable-row"
                    onClick={() => navigate(`/expenses/${exp.id}`)}
                  >
                    <td>
                      <span className="expense-id-badge">{exp.id}</span>
                    </td>
                    <td>{exp.date}</td>
                    <td>
                      <span className={`category-badge cat-${exp.categoryId.replace(/[^a-z]/g, "")}`}>
                        {getCategoryLabel(exp.categoryId)}
                      </span>
                    </td>
                    <td className="amount-cell">
                      {formatAmount(exp.amount, exp.currency)}
                    </td>
                    <td className="desc-cell">{exp.description}</td>
                    <td className="recorded-by-cell">{exp.recordedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* --- VIEW EXPENSE DETAIL MODAL --- */}
      {viewingExpense && (
        <div
          className="modal-overlay"
          onClick={() => navigate("/expenses")}
        >
          <div
            className="modal-content small-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                {t("expenseDetails")} – {viewingExpense.id}
              </h3>
              <button
                className="close-btn"
                onClick={() => navigate("/expenses")}
              >
                ×
              </button>
            </div>
            <div className="expense-detail-body">
              <div className="detail-card">
                <h4>{t("financialDetails")}</h4>
                <div className="detail-row">
                  <span className="detail-label">{t("amount")}</span>
                  <span className="detail-value expense-amount-highlight">
                    {formatAmount(viewingExpense.amount, viewingExpense.currency)}
                  </span>
                </div>
              </div>

              <div className="detail-card">
                <h4>{t("transactionClassification")}</h4>
                <div className="detail-row">
                  <span className="detail-label">{t("expenseCategory")}</span>
                  <span className="detail-value">
                    {getCategoryLabel(viewingExpense.categoryId)}
                  </span>
                </div>
              </div>

              <div className="detail-card">
                <h4>{t("metadataTracking")}</h4>
                <div className="detail-row">
                  <span className="detail-label">{t("date")}</span>
                  <span className="detail-value">{viewingExpense.date}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t("description")}</span>
                  <span className="detail-value">
                    {viewingExpense.description || "—"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">{t("recordedBy")}</span>
                  <span className="detail-value">
                    {viewingExpense.recordedBy}
                  </span>
                </div>
                {viewingExpense.receiptUrl && (
                  <div className="detail-row">
                    <span className="detail-label">{t("receipt")}</span>
                    <span className="detail-value">
                      <a href={viewingExpense.receiptUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary-color)", fontWeight: "bold" }}>
                        View Receipt Image
                      </a>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD EXPENSE MODAL --- */}
      {isAddModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="modal-content expense-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{t("recordNewExpense")}</h3>
              <button
                className="close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form className="expense-form" onSubmit={handleSubmit}>
              {/* --- Section 1: Financial Details --- */}
              <div className="form-section">
                <h4 className="form-section-title">
                  <span className="section-icon">💰</span>
                  {t("financialDetails")}
                </h4>
                <div className="form-grid-2">
                  <div className="form-input-group">
                    <label>
                      {t("amount")} <span className="required-star">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => handleFormChange("amount", e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-input-group">
                    <label>
                      {t("currency")} <span className="required-star">*</span>
                    </label>
                    <select
                      value={form.currency}
                      onChange={(e) => handleFormChange("currency", e.target.value)}
                    >
                      {CURRENCIES.map((cur) => (
                        <option key={cur} value={cur}>{cur}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* --- Section 2: Transaction Classification --- */}
              <div className="form-section">
                <h4 className="form-section-title">
                  <span className="section-icon">📋</span>
                  {t("transactionClassification")}
                </h4>
                <div className="form-input-group">
                  <label>
                    {t("expenseCategory")} <span className="required-star">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => handleFormChange("category", e.target.value)}
                    required
                  >
                    <option value="">{t("selectCategory")}</option>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* --- Section 3: Metadata & Tracking --- */}
              <div className="form-section">
                <h4 className="form-section-title">
                  <span className="section-icon">📝</span>
                  {t("metadataTracking")}
                </h4>
                <div className="form-grid-2">
                  <div className="form-input-group">
                    <label>{t("date")}</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => handleFormChange("date", e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-input-group">
                  <label>{t("descriptionRemarks")}</label>
                  <textarea
                    rows="3"
                    placeholder={t("expenseDescriptionPlaceholder")}
                    value={form.description}
                    onChange={(e) => handleFormChange("description", e.target.value)}
                  />
                </div>
                <div className="form-input-group">
                  <label>{t("attachmentReceipt")}</label>
                  <div className="file-upload-zone">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      id="receipt-upload"
                      onChange={handleReceiptUpload}
                    />
                    <label htmlFor="receipt-upload" className="upload-label">
                      <span className="upload-icon">📎</span>
                      {form.receiptFile ? form.receiptFile.name : t("chooseFileOrDrag")}
                    </label>
                    {form.receiptPreview && (
                      <div className="receipt-preview">
                        <img src={form.receiptPreview} alt={t("receipt")} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* --- Submit --- */}
              <div className="form-actions">
                <button
                  type="button"
                  className="action-btn cancel-btn"
                  onClick={() => {
                    setForm({ ...emptyForm });
                    setIsAddModalOpen(false);
                  }}
                >
                  {t("cancel")}
                </button>
                <button type="submit" className="action-btn primary-btn">
                  {t("recordExpense")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- PERIOD REPORT MODAL --- */}
      {isReportModalOpen && activePeriod && (
        <div
          className="modal-overlay"
          onClick={() => {
            setIsReportModalOpen(false);
            setActivePeriod(null);
          }}
        >
          <div
            className="modal-content period-report-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{getPeriodLabel()}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setIsReportModalOpen(false);
                  setActivePeriod(null);
                }}
              >
                ×
              </button>
            </div>

            {/* Printable report content */}
            <div className="period-report-body" id="printable-report">
              {/* Report Header for print */}
              <div className="print-report-header">
                <h2>{t("sarafiExpenses")}</h2>
                <p className="print-period-label">{getPeriodLabel()}</p>
              </div>

              {/* Period Totals Summary */}
              <div className="period-totals-row">
                {Object.keys(periodTotals).length > 0 ? (
                  Object.entries(periodTotals).map(([cur, total]) => (
                    <div key={cur} className="period-total-card">
                      <span className="period-total-label">
                        {t("periodTotal")} ({cur})
                      </span>
                      <span className="period-total-value">
                        {total.toLocaleString()} {cur}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="period-total-card">
                    <span className="period-total-label">{t("periodTotal")}</span>
                    <span className="period-total-value">0</span>
                  </div>
                )}
                <div className="period-total-card count-card">
                  <span className="period-total-label">{t("totalRecords")}</span>
                  <span className="period-total-value">{periodExpenses.length}</span>
                </div>
              </div>

              {/* Expenses Table */}
              <div className="table-wrapper">
                <table className="hawala-table">
                  <thead>
                    <tr>
                      <th>{t("expenseId")}</th>
                      <th>{t("date")}</th>
                      <th>{t("expenseCategory")}</th>
                      <th>{t("amount")}</th>
                      <th>{t("description")}</th>
                      <th>{t("recordedBy")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodExpenses.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-state">
                          {t("noExpensesInPeriod")}
                        </td>
                      </tr>
                    ) : (
                      periodExpenses.map((exp) => (
                        <tr key={exp.id}>
                          <td>
                            <span className="expense-id-badge">{exp.id}</span>
                          </td>
                          <td>{exp.date}</td>
                          <td>
                            <span
                              className={`category-badge cat-${exp.categoryId.replace(
                                /[^a-z]/g,
                                ""
                              )}`}
                            >
                              {getCategoryLabel(exp.categoryId)}
                            </span>
                          </td>
                          <td className="amount-cell">
                            {formatAmount(exp.amount, exp.currency)}
                          </td>
                          <td className="desc-cell">{exp.description}</td>
                          <td className="recorded-by-cell">{exp.recordedBy}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print Button */}
            <div className="period-report-actions">
              <button
                className="action-btn primary-btn print-btn"
                onClick={() => window.print()}
              >
                🖨️ {t("printReport")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
