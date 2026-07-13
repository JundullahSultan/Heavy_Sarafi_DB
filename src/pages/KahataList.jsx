import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRole } from "../utils/auth";
import { useLanguage } from "../context/LanguageContext";
import { usePopup } from "../context/PopupContext";
import API from "../utils/api";
import "./KahataList.css";

export default function KahataList() {
  const { t } = useLanguage();
  const { showAlert, showConfirm, showToast } = usePopup();
  const { id } = useParams();
  const navigate = useNavigate();

  const [kahataAccounts, setKahataAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const currentUserRole = getRole();

  // Create Account Form Fields
  const [newAccName, setNewAccName] = useState("");
  const [newAccType, setNewAccType] = useState("Merchant / Regular Customer");
  const [newAccPhone, setNewAccPhone] = useState("");
  const [newAccAddress, setNewAccAddress] = useState("");
  const [newAccCurrency, setNewAccCurrency] = useState("AFN");
  const [newAccInitBalance, setNewAccInitBalance] = useState("0");

  // Log Transaction Form Fields
  const [txnType, setTxnType] = useState("Credit");
  const [txnAmount, setTxnAmount] = useState("");
  const [txnDesc, setTxnDesc] = useState("");
  const [txnDate, setTxnDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Fetch accounts from database with localStorage caching
  useEffect(() => {
    const fetchAccounts = async () => {
      const cacheKey = `cache_kahata_${activeSearch}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setKahataAccounts(JSON.parse(cached));
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const res = await API.get(`/kahata?search=${activeSearch}`);
        setKahataAccounts(res.data);
        localStorage.setItem(cacheKey, JSON.stringify(res.data));
      } catch (err) {
        console.error("Error fetching ledger accounts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [activeSearch]);

  const selectedAccount = id ? kahataAccounts.find((a) => a.id === id) : null;

  const handleRowClick = (account) => navigate(`/kahata/${account.id}`);
  const closeViewModal = () => navigate("/kahata");

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!newAccName.trim()) return;

    const tempId = `KHT-TEMP-${Date.now()}`;
    const initialBal = parseFloat(newAccInitBalance) || 0;
    const tempTransactions = [];
    if (initialBal !== 0) {
      tempTransactions.push({
        id: "TXN-1",
        date: new Date().toISOString().split("T")[0],
        type: initialBal > 0 ? "Credit" : "Debit",
        amount: Math.abs(initialBal),
        description: "Opening Balance Adjustment",
      });
    }

    const tempAccount = {
      id: tempId,
      name: newAccName.trim(),
      type: newAccType,
      phone: newAccPhone.trim(),
      address: newAccAddress.trim(),
      currency: newAccCurrency,
      netBalance: initialBal,
      branch: "",
      transactions: tempTransactions,
      createdAt: new Date().toISOString(),
    };

    // 1. Instantly update UI and close modal
    setKahataAccounts((prev) => [...prev, tempAccount]);
    setIsNewAccountModalOpen(false);

    // Save form inputs for recovery
    const savedInputs = {
      name: newAccName,
      type: newAccType,
      phone: newAccPhone,
      address: newAccAddress,
      currency: newAccCurrency,
      initialBalance: newAccInitBalance,
    };

    // Reset inputs immediately
    setNewAccName("");
    setNewAccPhone("");
    setNewAccAddress("");
    setNewAccInitBalance("0");

    showToast("Opening ledger account...", { severity: "info", duration: 1500 });

    try {
      const payload = {
        name: savedInputs.name,
        type: savedInputs.type,
        phone: savedInputs.phone,
        address: savedInputs.address,
        currency: savedInputs.currency,
        initialBalance: parseFloat(savedInputs.initialBalance) || 0
      };
      
      const res = await API.post("/kahata", payload);
      // Replace optimistic account in state
      setKahataAccounts((prev) => {
        const updated = prev.map((a) => (a.id === tempId ? res.data : a));
        const cacheKey = `cache_kahata_${activeSearch}`;
        localStorage.setItem(cacheKey, JSON.stringify(updated));
        return updated;
      });
      showToast("Ledger account opened successfully!", { severity: "success" });
    } catch (err) {
      console.error("Error creating account:", err);
      // Rollback optimistic update
      setKahataAccounts((prev) => {
        const reverted = prev.filter((a) => a.id !== tempId);
        const cacheKey = `cache_kahata_${activeSearch}`;
        localStorage.setItem(cacheKey, JSON.stringify(reverted));
        return reverted;
      });
      // Restore inputs and reopen modal
      setNewAccName(savedInputs.name);
      setNewAccType(savedInputs.type);
      setNewAccPhone(savedInputs.phone);
      setNewAccAddress(savedInputs.address);
      setNewAccCurrency(savedInputs.currency);
      setNewAccInitBalance(savedInputs.initialBalance);
      setIsNewAccountModalOpen(true);
      showAlert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!txnAmount || !selectedAccount) return;

    const tempTxnId = `TXN-TEMP-${Date.now()}`;
    const parsedAmount = parseFloat(txnAmount);
    
    // Create optimistic transaction
    const newTxn = {
      id: tempTxnId,
      date: txnDate || new Date().toISOString().split("T")[0],
      type: txnType,
      amount: parsedAmount,
      description: txnDesc,
    };

    // Calculate optimistic netBalance
    const balanceChange = txnType === "Credit" ? parsedAmount : -parsedAmount;
    
    // 1. Instantly update account transactions & balance and close modal
    setKahataAccounts((prev) =>
      prev.map((a) => {
        if (a.id === selectedAccount.id) {
          return {
            ...a,
            netBalance: a.netBalance + balanceChange,
            transactions: [...a.transactions, newTxn],
          };
        }
        return a;
      })
    );
    setIsTransactionModalOpen(false);

    // Save inputs for recovery
    const savedInputs = {
      type: txnType,
      amount: txnAmount,
      description: txnDesc,
      date: txnDate,
      accountId: selectedAccount.id,
    };

    // Reset inputs immediately
    setTxnAmount("");
    setTxnDesc("");

    showToast("Logging transaction to ledger...", { severity: "info", duration: 1500 });

    try {
      const payload = {
        type: savedInputs.type,
        amount: parseFloat(savedInputs.amount),
        description: savedInputs.description,
        date: savedInputs.date
      };
      
      const res = await API.post(`/kahata/${savedInputs.accountId}/transaction`, payload);
      // Replace optimistic state with the server returned updated account
      setKahataAccounts((prev) => {
        const updated = prev.map((a) => (a.id === savedInputs.accountId ? res.data : a));
        const cacheKey = `cache_kahata_${activeSearch}`;
        localStorage.setItem(cacheKey, JSON.stringify(updated));
        return updated;
      });
      
      // If we are currently viewing this account, we need to refresh the URL router context so the detail modal updates
      // but selectedAccount is derived from URL parameters and find() in KahataList, which automatically updates since we updated kahataAccounts state!
      
      showToast("Transaction successfully logged to ledger.", { severity: "success" });
    } catch (err) {
      console.error("Error logging transaction:", err);
      // Revert optimistic changes
      setKahataAccounts((prev) => {
        const reverted = prev.map((a) => {
          if (a.id === savedInputs.accountId) {
            return {
              ...a,
              netBalance: a.netBalance - balanceChange,
              transactions: a.transactions.filter((t) => t.id !== tempTxnId),
            };
          }
          return a;
        });
        const cacheKey = `cache_kahata_${activeSearch}`;
        localStorage.setItem(cacheKey, JSON.stringify(reverted));
        return reverted;
      });
      // Restore form inputs and reopen modal
      setTxnAmount(savedInputs.amount);
      setTxnDesc(savedInputs.description);
      setTxnDate(savedInputs.date);
      setTxnType(savedInputs.type);
      setIsTransactionModalOpen(true);
      showAlert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteAccount = async (account) => {
    const confirmationMessage = `Are you sure you want to permanently delete account: ${account.name} (${account.id})?`;
    if (await showConfirm(confirmationMessage)) {
      try {
        await API.delete(`/kahata/${account.id}`);
        setKahataAccounts((prev) => prev.filter((acc) => acc.id !== account.id));
        closeViewModal();
      } catch (err) {
        console.error("Error deleting account:", err);
        showAlert("Error: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchVal);
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <div className="header-actions">
          <form className="search-bar" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search by Name or ID..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
            <button type="submit" className="search-btn">{t("search")}</button>
          </form>
          <button
            className="add-btn"
            onClick={() => setIsNewAccountModalOpen(true)}
          >
            + Create Account
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="empty-state" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div className="loader"></div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Account ID</th>
                <th>Account Name</th>
                <th>Classification</th>
                <th>Currency</th>
                <th>Net Balance</th>
              </tr>
            </thead>
            <tbody>
              {kahataAccounts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No ledger accounts found.
                  </td>
                </tr>
              ) : (
                kahataAccounts.map((account) => (
                  <tr key={account.id} onClick={() => handleRowClick(account)}>
                    <td className="text-light">{account.id}</td>
                    <td className="fw-bold">{account.name}</td>
                    <td>{account.type}</td>
                    <td>{account.currency}</td>
                    <td
                      className="fw-bold"
                      style={{
                        color:
                          account.netBalance >= 0
                            ? "var(--success)"
                            : "var(--danger)",
                      }}
                    >
                      {account.netBalance.toLocaleString()} {account.currency}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODAL 1: View Ledger Details --- */}
      {selectedAccount && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div
            className="modal-content view-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "900px" }}
          >
            <div className="modal-header">
              <h3>
                Ledger Account Statement: {selectedAccount.name} ({selectedAccount.id})
              </h3>
              <button className="close-btn" onClick={closeViewModal}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="account-summary-row" style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                <div className="detail-card" style={{ flex: 1 }}>
                  <h4>Account Classification</h4>
                  <p>{selectedAccount.type}</p>
                </div>
                <div className="detail-card" style={{ flex: 1 }}>
                  <h4>Phone / Contact</h4>
                  <p>{selectedAccount.phone || "—"}</p>
                </div>
                <div className="detail-card" style={{ flex: 1 }}>
                  <h4>Address</h4>
                  <p>{selectedAccount.address || "—"}</p>
                </div>
                <div className="detail-card" style={{ flex: 1 }}>
                  <h4>Current Balance</h4>
                  <p
                    className="fw-bold"
                    style={{
                      fontSize: "1.2rem",
                      color:
                        selectedAccount.netBalance >= 0
                          ? "var(--success)"
                          : "var(--danger)",
                    }}
                  >
                    {selectedAccount.netBalance.toLocaleString()} {selectedAccount.currency}
                  </p>
                </div>
              </div>

              <h4>Transaction History</h4>
              <div className="table-wrapper" style={{ maxHeight: "250px", overflowY: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>TXN ID</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAccount.transactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-state">
                          No transactions recorded.
                        </td>
                      </tr>
                    ) : (
                      selectedAccount.transactions.map((txn) => (
                        <tr key={txn.id}>
                          <td className="text-light">{txn.id}</td>
                          <td>{txn.date}</td>
                          <td
                            className="fw-bold"
                            style={{
                              color:
                                txn.type === "Credit"
                                  ? "var(--success)"
                                  : "var(--danger)",
                            }}
                          >
                            {txn.type.toUpperCase()}
                          </td>
                          <td>
                            {txn.amount.toLocaleString()} {selectedAccount.currency}
                          </td>
                          <td>{txn.description}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="action-btn danger"
                onClick={() => handleDeleteAccount(selectedAccount)}
              >
                Delete Account
              </button>
              <button
                className="action-btn submit-btn"
                onClick={() => setIsTransactionModalOpen(true)}
              >
                + Add Transaction
              </button>
              <button className="action-btn secondary" onClick={closeViewModal}>
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Create Account --- */}
      {isNewAccountModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsNewAccountModalOpen(false)}
        >
          <div
            className="modal-content add-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px" }}
          >
            <div className="modal-header">
              <h3>Create Ledger (Kahata) Account</h3>
              <button
                className="close-btn"
                onClick={() => setIsNewAccountModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateAccount}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Account / Business Name</label>
                  <input
                    type="text"
                    required
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Classification Type</label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value)}
                  >
                    <option value="Partner Sarafi (Another Branch/City)">
                      Partner Sarafi (Another Branch/City)
                    </option>
                    <option value="Merchant / Regular Customer">
                      Merchant / Regular Customer
                    </option>
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      value={newAccPhone}
                      onChange={(e) => setNewAccPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      value={newAccAddress}
                      onChange={(e) => setNewAccAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Account Currency</label>
                    <select
                      value={newAccCurrency}
                      onChange={(e) => setNewAccCurrency(e.target.value)}
                    >
                      <option value="AFN">AFN</option>
                      <option value="USD">USD</option>
                      <option value="PKR">PKR</option>
                      <option value="EUR">EUR</option>
                      <option value="CNY">CNY</option>
                      <option value="IRR">IRR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Opening Net Balance</label>
                    <input
                      type="number"
                      value={newAccInitBalance}
                      onChange={(e) => setNewAccInitBalance(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="action-btn secondary"
                  onClick={() => setIsNewAccountModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="action-btn submit-btn">
                  Open Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Log Transaction --- */}
      {isTransactionModalOpen && selectedAccount && (
        <div
          className="modal-overlay"
          onClick={() => setIsTransactionModalOpen(false)}
        >
          <div
            className="modal-content add-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "500px" }}
          >
            <div className="modal-header">
              <h3>Add transaction: {selectedAccount.name}</h3>
              <button
                className="close-btn"
                onClick={() => setIsTransactionModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddTransaction}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Transaction Type</label>
                  <select
                    value={txnType}
                    onChange={(e) => setTxnType(e.target.value)}
                  >
                    <option value="Credit">Credit (Add Funds / Deposit)</option>
                    <option value="Debit">Debit (Deduct Funds / Withdrawal)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount ({selectedAccount.currency})</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    value={txnAmount}
                    onChange={(e) => setTxnAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    required
                    value={txnDate}
                    onChange={(e) => setTxnDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Description Remarks</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cash settlement, transaction log"
                    value={txnDesc}
                    onChange={(e) => setTxnDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="action-btn secondary"
                  onClick={() => setIsTransactionModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="action-btn submit-btn">
                  Log Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
