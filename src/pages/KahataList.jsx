import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRole } from "../utils/auth";
import { useLanguage } from "../context/LanguageContext";
import API from "../utils/api";
import "./KahataList.css";

export default function KahataList() {
  const { t } = useLanguage();
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

  // Fetch accounts from database
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/kahata?search=${activeSearch}`);
        setKahataAccounts(res.data);
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
    try {
      const payload = {
        name: newAccName,
        type: newAccType,
        phone: newAccPhone,
        address: newAccAddress,
        currency: newAccCurrency,
        initialBalance: parseFloat(newAccInitBalance) || 0
      };
      
      const res = await API.post("/kahata", payload);
      setKahataAccounts((prev) => [...prev, res.data]);
      alert("Ledger account opened successfully!");
      setIsNewAccountModalOpen(false);
      // Reset fields
      setNewAccName("");
      setNewAccPhone("");
      setNewAccAddress("");
      setNewAccInitBalance("0");
    } catch (err) {
      console.error("Error creating account:", err);
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        type: txnType,
        amount: parseFloat(txnAmount),
        description: txnDesc,
        date: txnDate
      };
      
      const res = await API.post(`/kahata/${selectedAccount.id}/transaction`, payload);
      setKahataAccounts((prev) =>
        prev.map((a) => (a.id === selectedAccount.id ? res.data : a))
      );
      
      alert("Transaction successfully logged to ledger.");
      setIsTransactionModalOpen(false);
      // Reset transaction form
      setTxnAmount("");
      setTxnDesc("");
    } catch (err) {
      console.error("Error logging transaction:", err);
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteAccount = async (account) => {
    const confirmationMessage = `Are you sure you want to permanently delete account: ${account.name} (${account.id})?`;
    if (window.confirm(confirmationMessage)) {
      try {
        await API.delete(`/kahata/${account.id}`);
        setKahataAccounts((prev) => prev.filter((acc) => acc.id !== account.id));
        closeViewModal();
      } catch (err) {
        console.error("Error deleting account:", err);
        alert("Error: " + (err.response?.data?.message || err.message));
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
          <div className="empty-state">Loading ledger accounts...</div>
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
