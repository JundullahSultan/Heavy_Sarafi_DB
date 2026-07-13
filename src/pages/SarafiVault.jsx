import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { usePopup } from "../context/PopupContext";
import API from "../utils/api";
import "./SarafiVault.css";

const LOCATIONS = [
  "Primary Vault (Safe)",
];

const CURRENCIES = ["AFN", "USD", "PKR", "EUR", "CNY", "IRR", "GBP"];

export default function SarafiVault() {
  const { t } = useLanguage();
  const { showAlert, showConfirm, showToast } = usePopup();

  const [transactions, setTransactions] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [userBranch, setUserBranch] = useState("Kabul Branch");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("Credit"); // "Credit" = Deposit, "Debit" = Withdrawal

  // Form Fields
  const [dateField, setDateField] = useState(() => new Date().toISOString().split("T")[0]);
  const [locationField, setLocationField] = useState("Primary Vault (Safe)");
  const [amountField, setAmountField] = useState("");
  const [currencyField, setCurrencyField] = useState("AFN");
  const [descriptionField, setDescriptionField] = useState("");

  const getTranslatedLocation = (loc) => {
    const maps = {
      "Primary Vault (Safe)": t("primaryVault"),
      "Operator Cash Drawer (Till)": t("operatorTill"),
      "Local Bank Vault": t("localBankVault"),
    };
    return maps[loc] || loc;
  };

  const fetchData = async () => {
    const cacheKeyTxs = `cache_vault_txs_${filterLocation}_${filterCurrency}_${searchTerm}`;
    const cacheKeyBals = `cache_vault_bals`;
    const cachedTxs = localStorage.getItem(cacheKeyTxs);
    const cachedBals = localStorage.getItem(cacheKeyBals);

    if (cachedTxs && cachedBals) {
      setTransactions(JSON.parse(cachedTxs));
      setBalances(JSON.parse(cachedBals));
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const [txsRes, balRes, userRes] = await Promise.all([
        API.get(`/safes?location=${filterLocation}&currency=${filterCurrency}&search=${searchTerm}`),
        API.get("/safes/balances"),
        API.get("/auth/me"),
      ]);
      setTransactions(txsRes.data);
      setBalances(balRes.data);
      setUserBranch(userRes.data.branch || "Kabul Branch");
      
      localStorage.setItem(cacheKeyTxs, JSON.stringify(txsRes.data));
      localStorage.setItem(cacheKeyBals, JSON.stringify(balRes.data));
    } catch (err) {
      console.error("Error fetching safes data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterLocation, filterCurrency, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amountField || !descriptionField) return;

    const tempId = `SF-TEMP-${Date.now()}`;
    const parsedAmount = parseFloat(amountField);
    
    // Create optimistic transaction
    const tempTx = {
      id: tempId,
      date: dateField || new Date().toISOString().split("T")[0],
      type: modalType,
      location: locationField,
      amount: parsedAmount,
      currency: currencyField,
      description: descriptionField,
      recordedBy: "", 
      branch: userBranch,
      createdAt: new Date().toISOString(),
    };

    const savedInputs = {
      date: dateField,
      type: modalType,
      location: locationField,
      amount: amountField,
      currency: currencyField,
      description: descriptionField,
    };

    // 1. Instantly update list state and balances state
    setTransactions((prev) => [tempTx, ...prev]);
    
    // Update balances optimistically
    const balanceChange = modalType === "Credit" ? parsedAmount : -parsedAmount;
    setBalances((prev) => {
      let found = false;
      const nextBals = prev.map((bal) => {
        if (bal.location === locationField && bal.currency === currencyField) {
          found = true;
          return { ...bal, balance: bal.balance + balanceChange };
        }
        return bal;
      });
      if (!found) {
        nextBals.push({ location: locationField, currency: currencyField, balance: balanceChange });
      }
      return nextBals;
    });

    setIsModalOpen(false);
    
    // Reset form fields immediately
    setAmountField("");
    setDescriptionField("");

    showToast(modalType === "Credit" ? "Processing deposit..." : "Processing withdrawal...", { severity: "info", duration: 1500 });

    try {
      const payload = {
        date: savedInputs.date,
        type: savedInputs.type,
        location: savedInputs.location,
        amount: parseFloat(savedInputs.amount),
        currency: savedInputs.currency,
        description: savedInputs.description,
      };

      const res = await API.post("/safes", payload);
      
      // Replace optimistic temp transaction with actual saved transaction from DB
      setTransactions((prev) => {
        const updated = prev.map((t) => (t.id === tempId ? res.data : t));
        const cacheKeyTxs = `cache_vault_txs_${filterLocation}_${filterCurrency}_${searchTerm}`;
        localStorage.setItem(cacheKeyTxs, JSON.stringify(updated));
        return updated;
      });

      // Refetch actual fresh data in background to sync all balances & items perfectly
      const balRes = await API.get("/safes/balances");
      setBalances(balRes.data);
      localStorage.setItem(`cache_vault_bals`, JSON.stringify(balRes.data));

      showToast(savedInputs.type === "Credit" ? t("depositSuccess") : t("withdrawalSuccess"), { severity: "success" });
    } catch (err) {
      console.error("Error creating transaction:", err);
      // Revert optimistic transactions
      setTransactions((prev) => {
        const reverted = prev.filter((t) => t.id !== tempId);
        const cacheKeyTxs = `cache_vault_txs_${filterLocation}_${filterCurrency}_${searchTerm}`;
        localStorage.setItem(cacheKeyTxs, JSON.stringify(reverted));
        return reverted;
      });
      // Revert optimistic balances
      setBalances((prev) =>
        prev.map((bal) => {
          if (bal.location === savedInputs.location && bal.currency === savedInputs.currency) {
            return { ...bal, balance: bal.balance - balanceChange };
          }
          return bal;
        })
      );
      // Restore form fields and open modal
      setAmountField(savedInputs.amount);
      setDescriptionField(savedInputs.description);
      setDateField(savedInputs.date);
      setLocationField(savedInputs.location);
      setCurrencyField(savedInputs.currency);
      setModalType(savedInputs.type);
      setIsModalOpen(true);
      showAlert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (txId) => {
    const txToDelete = transactions.find((t) => t.id === txId);
    if (!txToDelete) return;

    if (!await showConfirm(t("deleteConfirm"))) return;

    // Save state before optimistic delete
    const originalTransactions = [...transactions];
    const originalBalances = [...balances];

    // 1. Instantly update UI states optimistically
    setTransactions((prev) => prev.filter((t) => t.id !== txId));
    
    // Reverse the balance impact of the deleted transaction
    const balanceChange = txToDelete.type === "Credit" ? -txToDelete.amount : txToDelete.amount;
    setBalances((prev) =>
      prev.map((bal) => {
        if (bal.location === txToDelete.location && bal.currency === txToDelete.currency) {
          return { ...bal, balance: bal.balance + balanceChange };
        }
        return bal;
      })
    );

    showToast("Deleting transaction...", { severity: "info", duration: 1500 });

    try {
      await API.delete(`/safes/${txId}`);
      
      // Update cache
      const cacheKeyTxs = `cache_vault_txs_${filterLocation}_${filterCurrency}_${searchTerm}`;
      localStorage.setItem(cacheKeyTxs, JSON.stringify(transactions.filter((t) => t.id !== txId)));
      localStorage.setItem(`cache_vault_bals`, JSON.stringify(balances));

      showToast(t("deleteSuccess"), { severity: "success" });
    } catch (err) {
      console.error("Error deleting transaction:", err);
      // Revert state
      setTransactions(originalTransactions);
      setBalances(originalBalances);
      showAlert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  // Group balances by location
  const getBalancesByLocation = () => {
    const locMap = {};
    LOCATIONS.forEach((loc) => {
      locMap[loc] = {};
      CURRENCIES.forEach((cur) => {
        locMap[loc][cur] = 0;
      });
    });

    balances.forEach((bal) => {
      if (locMap[bal.location]) {
        locMap[bal.location][bal.currency] = bal.balance;
      }
    });

    return locMap;
  };

  // Group balances by global currency
  const getGlobalBalances = () => {
    const global = { AFN: 0, USD: 0, EUR: 0 };
    balances.forEach((bal) => {
      if (global[bal.currency] !== undefined) {
        global[bal.currency] += bal.balance;
      }
    });
    return global;
  };

  const locBalances = getBalancesByLocation();
  const globalBalances = getGlobalBalances();

  return (
    <div className="list-container">
      <div className="list-header" style={{ justifyContent: "flex-end" }}>
        <div className="header-actions">
          <button
            className="add-btn"
            style={{ backgroundColor: "var(--success)", border: "none", marginRight: "10px" }}
            onClick={() => {
              setModalType("Credit");
              setIsModalOpen(true);
            }}
          >
            {t("depositCash")}
          </button>
          <button
            className="add-btn"
            style={{ backgroundColor: "var(--danger)", border: "none" }}
            onClick={() => {
              setModalType("Debit");
              setIsModalOpen(true);
            }}
          >
            {t("withdrawTransferCash")}
          </button>
        </div>
      </div>

      {/* Global Liquidity Cards */}
      <h3 className="section-title mt-4">{t("globalNetLiquidity")}</h3>
      <div className="grid stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {Object.entries(globalBalances).map(([cur, bal]) => (
          <div key={cur} className="card metric-card">
            <h3>{t("totalSafeCash")} ({cur})</h3>
            <div className={`value ${bal >= 0 ? "text-success" : "text-danger"}`}>
              {bal.toLocaleString()} {cur}
            </div>
            <p className="trend neutral">{t("netNetworkAssets")}</p>
          </div>
        ))}
      </div>

      {/* Filter and Transaction Logs */}
      <h3 className="section-title mt-4">{t("safeLedgerAuditLogs")}</h3>
      <div className="expense-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder={t("searchDescriptionPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={filterCurrency}
          onChange={(e) => setFilterCurrency(e.target.value)}
        >
          <option value="all">{t("allCurrencies")}</option>
          {CURRENCIES.map((cur) => (
            <option key={cur} value={cur}>
              {cur}
            </option>
          ))}
        </select>
      </div>

      {/* Transactions Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="empty-state" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div className="loader"></div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("txId")}</th>
                <th>{t("date")}</th>
                <th>{t("locationTill")}</th>
                <th>{t("type")}</th>
                <th>{t("amount")}</th>
                <th>{t("description")}</th>
                <th>{t("recordedBy")}</th>
                <th style={{ textAlign: "right" }}>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    {t("noTransactionsMatching")}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-light">{tx.id}</td>
                    <td>{tx.date}</td>
                    <td className="fw-bold">{getTranslatedLocation(tx.location)}</td>
                    <td>
                      <span className={`status-badge ${tx.type === "Credit" ? "paid" : "pending"}`}>
                        {tx.type === "Credit" ? t("deposit") : t("withdrawal")}
                      </span>
                    </td>
                    <td className="fw-bold" style={{ color: tx.type === "Credit" ? "var(--success)" : "var(--danger)" }}>
                      {tx.type === "Credit" ? "+" : "-"}
                      {tx.amount.toLocaleString()} {tx.currency}
                    </td>
                    <td>{tx.description}</td>
                    <td>{tx.recordedBy}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="action-btn danger small-btn"
                        onClick={() => handleDelete(tx.id)}
                      >
                        {t("delete")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: Record Inflow / Outflow */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content add-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "550px" }}
          >
            <div className="modal-header">
              <h3>
                {modalType === "Credit" ? t("depositSafeCashCredit") : t("withdrawTransferSafeCashDebit")}
              </h3>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>{t("date")}</label>
                  <input
                    type="date"
                    required
                    value={dateField}
                    onChange={(e) => setDateField(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{t("sourceDestinationTill")}</label>
                  <select
                    value={locationField}
                    onChange={(e) => setLocationField(e.target.value)}
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {getTranslatedLocation(loc)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>{t("amount")}</label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={amountField}
                      onChange={(e) => setAmountField(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Currency</label>
                    <select
                      value={currencyField}
                      onChange={(e) => setCurrencyField(e.target.value)}
                    >
                      {CURRENCIES.map((cur) => (
                        <option key={cur} value={cur}>
                          {cur}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t("descriptionRemarks")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("safeDescriptionPlaceholder")}
                    value={descriptionField}
                    onChange={(e) => setDescriptionField(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="action-btn secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  {t("cancel")}
                </button>
                <button type="submit" className="action-btn submit-btn">
                  {t("recordSafeEntry")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
