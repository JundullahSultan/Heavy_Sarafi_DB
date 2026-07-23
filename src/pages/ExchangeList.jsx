import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { usePopup } from "../context/PopupContext";
import API from "../utils/api";
import CustomCalendar from "../components/CustomCalendar";
import CustomDropdown from "../components/CustomDropdown";
import { RefreshCw, Trash2, Search, DollarSign, BarChart2, Plus, Calendar, User, ArrowRight, X } from "lucide-react";
import "./ExchangeList.css";

const CURRENCIES = ["AFN", "USD", "PKR", "EUR", "CNY", "IRR", "GBP"];

const todayStr = () => new Date().toISOString().split("T")[0];

export default function ExchangeList() {
  const { t, formatDate } = useLanguage();
  const { showAlert, showToast } = usePopup();
  const navigate = useNavigate();

  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const emptyForm = {
    date: todayStr(),
    clientName: "",
    fromCurrency: "USD",
    fromAmount: "",
    toCurrency: "AFN",
    toAmount: "",
    rate: "",
    benefit: "",
    benefitCurrency: "AFN",
  };
  const [form, setForm] = useState({ ...emptyForm });

  // Load Exchanges
  const fetchExchanges = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/exchanges?search=${searchTerm}`);
      setExchanges(res.data);
    } catch (err) {
      console.error("Error fetching exchanges:", err);
      showToast("Error loading exchange data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchanges();
  }, [searchTerm]);

  // Form Handlers
  const handleFormChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate exchange rate if amounts are specified
      if ((field === "fromAmount" || field === "toAmount" || field === "rate") && updated.fromAmount && updated.toAmount) {
        const fromVal = parseFloat(updated.fromAmount);
        const toVal = parseFloat(updated.toAmount);
        if (fromVal > 0 && toVal > 0 && field !== "rate") {
          // Standard rate is Target / Source
          updated.rate = (toVal / fromVal).toFixed(4);
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fromAmount || !form.toAmount || !form.rate) {
      showToast("Please enter all exchange details", "warning");
      return;
    }

    try {
      await API.post("/exchanges", {
        date: form.date,
        clientName: form.clientName,
        fromCurrency: form.fromCurrency,
        fromAmount: parseFloat(form.fromAmount),
        toCurrency: form.toCurrency,
        toAmount: parseFloat(form.toAmount),
        rate: parseFloat(form.rate),
        benefit: parseFloat(form.benefit) || 0,
        benefitCurrency: form.benefitCurrency,
      });

      showToast("Exchange transaction recorded successfully", "success");
      setIsAddModalOpen(false);
      setForm({ ...emptyForm });
      fetchExchanges();
    } catch (err) {
      console.error("Error saving exchange:", err);
      showToast(err.response?.data?.message || "Failed to record exchange", "error");
    }
  };

  const handleDelete = async (id) => {
    showAlert({
      title: t("deleteExchangeRecord"),
      message: t("deleteExchangeConfirm"),
      confirmText: t("delete"),
      cancelText: t("cancel"),
      onConfirm: async () => {
        try {
          await API.delete(`/exchanges/${id}`);
          showToast("Exchange record deleted", "success");
          fetchExchanges();
        } catch (err) {
          console.error("Error deleting exchange:", err);
          showToast("Failed to delete record", "error");
        }
      },
    });
  };

  // Summary Metrics Calculations
  const totalTransactions = exchanges.length;
  
  // Calculate total benefit grouped by currency
  const benefitTotals = exchanges.reduce((acc, curr) => {
    const currency = curr.benefitCurrency || "AFN";
    acc[currency] = (acc[currency] || 0) + (curr.benefit || 0);
    return acc;
  }, {});

  return (
    <div className="list-container">
      {/* Upper header */}
      <div className="list-header">
        <div>
          <h2>{t("currencyExchange")}</h2>
          <p className="subtitle">{t("currencyExchangeDesc")}</p>
        </div>
        <button className="action-btn header-add-btn" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>{t("newExchange")}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card glass-card">
          <div className="metric-icon total-trades">
            <RefreshCw size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">{t("totalTransactions")}</span>
            <span className="metric-value">{totalTransactions}</span>
          </div>
        </div>

        <div className="metric-card glass-card profit-card">
          <div className="metric-icon total-benefit">
            <BarChart2 size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">{t("totalBenefits")}</span>
            <div className="benefit-list">
              {Object.keys(benefitTotals).length > 0 ? (
                Object.entries(benefitTotals).map(([currency, total]) => (
                  <span key={currency} className="benefit-total-item">
                    <strong>{total.toLocaleString()}</strong> {currency}
                  </span>
                ))
              ) : (
                <span className="benefit-total-item">0 AFN</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="filters">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder={t("searchExchangePlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="table-loader-container">
            <div className="loader"></div>
          </div>
        ) : exchanges.length === 0 ? (
          <div className="empty-table-state">
            <RefreshCw size={48} className="empty-icon" />
            <h3>{t("noExchangeFound")}</h3>
            <p>{t("recordFirstExchange")}</p>
          </div>
        ) : (
          <table className="data-table exchange-table">
            <thead>
              <tr>
                <th>{t("transactionId")}</th>
                <th>{t("date")}</th>
                <th>{t("fullName")}</th>
                <th>{t("exchangeDetails")}</th>
                <th>{t("rate")}</th>
                <th>{t("exchangeBenefit")}</th>
                <th>{t("branch")}</th>
                <th>{t("operator")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {exchanges.map((ex) => (
                <tr key={ex.id} className="responsive-table-row">
                  <td className="cell-id bold">{ex.id}</td>
                  <td className="cell-date">{formatDate(ex.date)}</td>
                  <td className="cell-client bold">{ex.clientName}</td>
                  <td className="cell-details exchange-pair-td">
                    <span className="sold-pill">{ex.fromAmount.toLocaleString()} {t("currency_" + ex.fromCurrency)}</span>
                    <ArrowRight size={14} className="arrow-split" />
                    <span className="bought-pill">{ex.toAmount.toLocaleString()} {t("currency_" + ex.toCurrency)}</span>
                  </td>
                  <td className="cell-rate bold">
                    <span className="mobile-only-label">{t("exchangeRate")}: </span>
                    {ex.rate}
                  </td>
                  <td className="cell-benefit benefit-text bold">
                    +{ex.benefit?.toLocaleString()} {t("currency_" + ex.benefitCurrency)}
                  </td>
                  <td className="cell-branch">{ex.branch}</td>
                  <td className="cell-operator recorded-by">{ex.recordedBy}</td>
                  <td className="cell-actions">
                    <button className="delete-row-btn" onClick={() => handleDelete(ex.id)} aria-label="Delete exchange">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Exchange Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <div className="modal-header">
              <h3>{t("recordCurrencyExchange")}</h3>
              <button className="close-modal-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row double">
                  <div className="form-group">
                    <label>{t("date")}</label>
                    <div className="input-with-icon">
                      <Calendar size={16} />
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => handleFormChange("date", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{t("clientNameLabel")}</label>
                    <div className="input-with-icon">
                      <User size={16} />
                      <input
                        type="text"
                        placeholder="e.g. Walk-in client"
                        value={form.clientName}
                        onChange={(e) => handleFormChange("clientName", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <hr className="modal-divider" />

                <div className="exchange-inputs-container">
                  {/* From (Sell) */}
                  <div className="form-row double">
                    <div className="form-group">
                      <label>{t("giveFromCurrency")}</label>
                      <CustomDropdown
                        options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                        value={form.fromCurrency}
                        onChange={(val) => handleFormChange("fromCurrency", val)}
                        variant="6"
                      />
                    </div>
                    <div className="form-group">
                      <label>{t("amountDelivered")}</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={form.fromAmount}
                        onChange={(e) => handleFormChange("fromAmount", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="arrow-down-divider">
                    <ArrowRight size={20} className="exchange-flow-arrow" />
                  </div>

                  {/* To (Buy) */}
                  <div className="form-row double">
                    <div className="form-group">
                      <label>{t("receiveToCurrency")}</label>
                      <CustomDropdown
                        options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                        value={form.toCurrency}
                        onChange={(val) => handleFormChange("toCurrency", val)}
                        variant="6"
                      />
                    </div>
                    <div className="form-group">
                      <label>{t("amountReceived")}</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={form.toAmount}
                        onChange={(e) => handleFormChange("toAmount", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <hr className="modal-divider" />

                <div className="form-row triple">
                  <div className="form-group">
                    <label>{t("exchangeRate")}</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Automatic"
                      value={form.rate}
                      onChange={(e) => handleFormChange("rate", e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("benefitNetProfit")}</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={form.benefit}
                      onChange={(e) => handleFormChange("benefit", e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("profitCurrency")}</label>
                    <CustomDropdown
                      options={CURRENCIES.map((c) => ({ value: c, label: c }))}
                      value={form.benefitCurrency}
                      onChange={(val) => handleFormChange("benefitCurrency", val)}
                      variant="6"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn secondary" onClick={() => setIsAddModalOpen(false)}>
                  {t("cancel")}
                </button>
                <button type="submit" className="action-btn submit-btn">
                  {t("recordTransaction")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
