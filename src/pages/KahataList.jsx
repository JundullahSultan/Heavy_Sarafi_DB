import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRole } from "../utils/auth";
import { useLanguage } from "../context/LanguageContext";
import { usePopup } from "../context/PopupContext";
import API from "../utils/api";
import CustomCalendar from "../components/CustomCalendar";
import "./KahataList.css";

export default function KahataList() {
  const { t, language, formatDate } = useLanguage();
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
  const [newAccWhatsapp, setNewAccWhatsapp] = useState("");
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

  const handleWhatsAppSend = () => {
    if (!selectedAccount) return;
    if (!selectedAccount.whatsapp) {
      showToast(t("noWhatsAppSaved"), { severity: "warning" });
      return;
    }

    let cleanNumber = selectedAccount.whatsapp.replace(/\D/g, "");
    
    // Format local numbers to international format (default country code 93 for Afghanistan)
    if (cleanNumber.startsWith("0") && !cleanNumber.startsWith("00")) {
      cleanNumber = "93" + cleanNumber.substring(1);
    } else if (cleanNumber.startsWith("00")) {
      cleanNumber = cleanNumber.substring(2);
    }
    
    if (cleanNumber.length === 9 && !cleanNumber.startsWith("93")) {
      cleanNumber = "93" + cleanNumber;
    }

    let message = "";

    if (language === "ps") {
      message = `📋 *د حساب راپور:* ${selectedAccount.name}\n`;
      message += `🆔 *حساب آی ډي:* ${selectedAccount.id}\n`;
      message += `💰 *باقي بیلانس:* ${selectedAccount.netBalance.toLocaleString()} ${selectedAccount.currency}\n\n`;
      message += `🔄 *وروستۍ معاملې:*\n`;
      selectedAccount.transactions.slice(-15).forEach((tx) => {
        const typeEmoji = tx.type === "Credit" ? "🟢" : "🔴";
        const typeLabel = tx.type === "Credit" ? "جمع" : "خارج";
        message += `${typeEmoji} ${formatDate(tx.date)} | ${typeLabel} | ${tx.amount.toLocaleString()} | ${tx.description || ""}\n`;
      });
    } else if (language === "fa") {
      message = `📋 *صورتحساب:* ${selectedAccount.name}\n`;
      message += `🆔 *آی‌دی حساب:* ${selectedAccount.id}\n`;
      message += `💰 *باقی‌مانده:* ${selectedAccount.netBalance.toLocaleString()} ${selectedAccount.currency}\n\n`;
      message += `🔄 *تراکنش‌های اخیر:*\n`;
      selectedAccount.transactions.slice(-15).forEach((tx) => {
        const typeEmoji = tx.type === "Credit" ? "🟢" : "🔴";
        const typeLabel = tx.type === "Credit" ? "رسید" : "برد";
        message += `${typeEmoji} ${formatDate(tx.date)} | ${typeLabel} | ${tx.amount.toLocaleString()} | ${tx.description || ""}\n`;
      });
    } else {
      message = `📋 *Statement for:* ${selectedAccount.name}\n`;
      message += `🆔 *Account ID:* ${selectedAccount.id}\n`;
      message += `💰 *Net Balance:* ${selectedAccount.netBalance.toLocaleString()} ${selectedAccount.currency}\n\n`;
      message += `🔄 *Recent Transactions:*\n`;
      selectedAccount.transactions.slice(-15).forEach((tx) => {
        const typeEmoji = tx.type === "Credit" ? "🟢" : "🔴";
        message += `${typeEmoji} ${formatDate(tx.date)} | ${tx.type} | ${tx.amount.toLocaleString()} | ${tx.description || ""}\n`;
      });
    }

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
  };

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
      whatsapp: newAccWhatsapp.trim(),
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
      whatsapp: newAccWhatsapp,
      address: newAccAddress,
      currency: newAccCurrency,
      initialBalance: newAccInitBalance,
    };

    // Reset inputs immediately
    setNewAccName("");
    setNewAccPhone("");
    setNewAccWhatsapp("");
    setNewAccAddress("");
    setNewAccInitBalance("0");

    showToast(t("openingLedgerAccount"), { severity: "info", duration: 1500 });

    try {
      const payload = {
        name: savedInputs.name,
        type: savedInputs.type,
        phone: savedInputs.phone,
        whatsapp: savedInputs.whatsapp,
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
      showToast(t("ledgerAccountOpened"), { severity: "success" });
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
      setNewAccWhatsapp(savedInputs.whatsapp);
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

    showToast(t("loggingTransaction"), { severity: "info", duration: 1500 });

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
      
      showToast(t("transactionLogged"), { severity: "success" });
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
    const confirmationMessage = `${t("confirmDeleteAccount")} ${account.name} (${account.id})?`;
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
              placeholder={t("searchByNameOrId")}
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
            <button type="submit" className="search-btn">{t("search")}</button>
          </form>
          <button
            className="add-btn"
            onClick={() => setIsNewAccountModalOpen(true)}
          >
            {t("createKahataAccountButton")}
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="empty-state" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div className="loader"></div>
          </div>
        ) : (
          <table className="data-table main-kahata-table">
            <thead>
              <tr>
                <th>{t("kahataId")}</th>
                <th>{t("accountName")}</th>
                <th>{t("accountType")}</th>
                <th>{t("currency")}</th>
                <th>{t("netBalance")}</th>
              </tr>
            </thead>
            <tbody>
              {kahataAccounts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    {t("noKahataAccountsFound")}
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
                {t("ledgerAccountStatement")} {selectedAccount.name} ({selectedAccount.id})
              </h3>
              <button className="close-btn" onClick={closeViewModal}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="account-summary-row">
                <div className="detail-card" style={{ flex: 1 }}>
                  <h4>{t("accountClassification")}</h4>
                  <p>{selectedAccount.type}</p>
                </div>
                <div className="detail-card" style={{ flex: 1 }}>
                  <h4>{t("contactInformation")}</h4>
                  <p>{selectedAccount.phone || "—"}</p>
                </div>
                <div className="detail-card" style={{ flex: 1 }}>
                  <h4>{t("address")}</h4>
                  <p>{selectedAccount.address || "—"}</p>
                </div>
                <div className="detail-card" style={{ flex: 1 }}>
                  <h4>{t("currentNetBalance")}</h4>
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

              <h4>{t("transactionHistory")}</h4>
              <div className="table-wrapper" style={{ minHeight: "250px", overflowY: "auto" }}>
                <table className="data-table ledger-tx-table">
                  <thead>
                    <tr style={{minWidth: "100px"}}>
                      <th>{t("txId")}</th>
                      <th>{t("date")}</th>
                      <th>{t("type")}</th>
                      <th>{t("amount")}</th>
                      <th>{t("description")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAccount.transactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-state">
                          {t("noTransactionsFound")}
                        </td>
                      </tr>
                    ) : (
                      selectedAccount.transactions.map((txn) => (
                        <tr key={txn.id}>
                          <td className="text-light">{txn.id}</td>
                          <td>{formatDate(txn.date)}</td>
                          <td
                            className="fw-bold"
                            style={{
                              color:
                                txn.type === "Credit"
                                  ? "var(--success)"
                                  : "var(--danger)",
                            }}
                          >
                            {t(txn.type.toLowerCase()).toUpperCase()}
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
                {t("deleteAccount")}
              </button>
              <button
                className="action-btn submit-btn"
                onClick={() => setIsTransactionModalOpen(true)}
              >
                {t("addTransaction")}
              </button>
              <button className="action-btn secondary" onClick={handleWhatsAppSend}>
                {t("sendWhatsapp")}
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
              <h3>{t("createKahataAccountTitle")}</h3>
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
                  <label>{t("accountNameBusinessName")}</label>
                  <input
                    type="text"
                    required
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{t("transactionClassification")}</label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value)}
                  >
                    <option value="Partner Sarafi (Another Branch/City)">
                      {t("partnerSarafi")}
                    </option>
                    <option value="Merchant / Regular Customer">
                      {t("merchantCustomer")}
                    </option>
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>{t("phoneNumber")}</label>
                    <input
                      type="text"
                      value={newAccPhone}
                      onChange={(e) => setNewAccPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("whatsappNumber")}</label>
                    <input
                      type="text"
                      value={newAccWhatsapp}
                      onChange={(e) => setNewAccWhatsapp(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t("address")}</label>
                  <input
                    type="text"
                    value={newAccAddress}
                    onChange={(e) => setNewAccAddress(e.target.value)}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>{t("accountCurrency")}</label>
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
                    <label>{t("openingNetBalance")}</label>
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
                  {t("cancel")}
                </button>
                <button type="submit" className="action-btn submit-btn">
                  {t("openAccount")}
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
              <h3>{t("addTransactionTo")} {selectedAccount.name}</h3>
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
                  <label>{t("transactionType")}</label>
                  <select
                    value={txnType}
                    onChange={(e) => setTxnType(e.target.value)}
                  >
                    <option value="Credit">{t("creditAddFunds")}</option>
                    <option value="Debit">{t("debitDeductFunds")}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{t("amount")} ({selectedAccount.currency})</label>
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
                  <label>{t("date")}</label>
                  <CustomCalendar
                    value={txnDate}
                    onChange={setTxnDate}
                    label={t("date")}
                  />
                </div>

                <div className="form-group">
                  <label>{t("descriptionRemarks")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("transactionDescExample")}
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
                  {t("cancel")}
                </button>
                <button type="submit" className="action-btn submit-btn">
                  {t("logTransaction")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
