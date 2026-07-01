import React, { useState } from "react";
import "./KahataList.css";
import { getRole, ROLES } from "../utils/auth";
import { useLanguage } from "../context/LanguageContext";

export default function KahataList() {
  const { t } = useLanguage();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const currentUserRole = getRole();

  // Mock Data: Kahata (Ledger) Accounts
  const [kahataAccounts, setKahataAccounts] = useState([
    {
      id: "KHT-8001",
      name: "Haji Abdul Rahman",
      type: t("partnerSarafi"),
      phone: "0799112233",
      address: "Kandahar Market",
      currency: "AFN",
      netBalance: 250000,
      transactions: [
        {
          id: "TXN-1",
          date: "2026-06-25",
          type: "Credit",
          amount: 300000,
          description: "Initial Deposit / Opening Balance",
        },
        {
          id: "TXN-2",
          date: "2026-06-27",
          type: "Debit",
          amount: 50000,
          description: "Settlement for SHW-5011",
        },
      ],
    },
    {
      id: "KHT-8002",
      name: "Zamani Electronics",
      type: t("merchantCustomer"),
      phone: "0700445566",
      address: "Kabul, District 2",
      currency: "USD",
      netBalance: -1500,
      transactions: [
        {
          id: "TXN-3",
          date: "2026-06-10",
          type: "Credit",
          amount: 5000,
          description: "Cash Deposit",
        },
        {
          id: "TXN-4",
          date: "2026-06-15",
          type: "Debit",
          amount: 6500,
          description: "Sent Hawala to Dubai",
        },
      ],
    },
  ]);

  const handleRowClick = (account) => setSelectedAccount(account);
  const closeViewModal = () => setSelectedAccount(null);

  const handleCreateAccount = (e) => {
    e.preventDefault();
    alert(t("createKahataAccountTitle"));
    setIsNewAccountModalOpen(false);
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    alert(t("saveRecord"));
    setIsTransactionModalOpen(false);
  };

  const handleDeleteAccount = (account) => {
    // Fully translated confirmation message with placeholders
    const confirmationMessage = t("deleteKahataConfirmation")
      .replace("{name}", account.name)
      .replace("{id}", account.id);
    if (window.confirm(confirmationMessage)) {
      setKahataAccounts((prev) => prev.filter((acc) => acc.id !== account.id));
      closeViewModal();
      console.log(`Kahata ${account.id} deleted by ${currentUserRole}.`);
    }
  };

  const handleStartEdit = (account) => {
    setEditingAccount({ ...account });
    closeViewModal();
  };

  const handleEditChange = (field, value) => {
    setEditingAccount((prev) => ({ ...prev, [field]: value }));
  };

  const submitEditedAccount = (e) => {
    e.preventDefault();
    setKahataAccounts((prevAccounts) =>
      prevAccounts.map((acc) =>
        acc.id === editingAccount.id ? editingAccount : acc,
      ),
    );
    setEditingAccount(null);
    alert(`${t("editKahata")} ${editingAccount.id} ${t("hawalaUpdated")}`);
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <h2 className="section-title">{t("kahataDirectory")}</h2>
        <div className="header-actions-group kahata-filter-actions">
          <div className="search-bar">
            <input type="text" placeholder={t("searchNamePhoneOrId")} />
            <button className="search-btn">{t("search")}</button>
          </div>
          <button
            className="action-btn submit-btn fw-bold"
            onClick={() => setIsNewAccountModalOpen(true)}
          >
            {t("createKahataAccountButton")}
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="hawala-table">
          <thead>
            <tr>
              <th>{t("kahataId")}</th>
              <th>{t("accountName")}</th>
              <th>{t("accountType")}</th>
              <th>{t("phoneNumber")}</th>
              <th>{t("currency")}</th>
              <th>{t("netBalance")}</th>
              <th>{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {kahataAccounts.map((account) => (
              <tr
                key={account.id}
                onClick={() => handleRowClick(account)}
                className="clickable-row"
              >
                <td className="fw-bold text-light">{account.id}</td>
                <td className="fw-bold">{account.name}</td>
                <td>{account.type}</td>
                <td>{account.phone}</td>
                <td>{account.currency}</td>
                <td
                  className={`fw-bold ${
                    account.netBalance >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {account.netBalance > 0 ? "+" : ""}
                  {account.netBalance.toLocaleString()} {account.currency}
                </td>
                <td>
                  <span className="status-badge paid">{t("active")}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL 1: VIEW KAHATA LEDGER DETAILS --- */}
      {selectedAccount && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div
            className="modal-content ledger-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header sticky-header">
              <div>
                <h3 style={{ marginBottom: "0.25rem" }}>
                  {t("ledger")}: {selectedAccount.name}
                </h3>
                <span className="badge-secondary">
                  {selectedAccount.id} • {selectedAccount.type}
                </span>
              </div>
              <button className="close-btn" onClick={closeViewModal}>
                &times;
              </button>
            </div>
            <div className="modal-body ledger-body">
              <div className="ledger-summary-grid">
                <div className="info-card bg-white">
                  <h4 className="info-card-title">{t("contactInformation")}</h4>
                  <p className="info-row">
                    <strong>{t("phoneNumber")}:</strong> {selectedAccount.phone}
                  </p>
                  <p className="info-row">
                    <strong>{t("address")}:</strong> {selectedAccount.address}
                  </p>
                  <p className="info-row">
                    <strong>{t("baseCurrency")}:</strong>{" "}
                    {selectedAccount.currency}
                  </p>
                </div>
                <div
                  className={`info-card highlight-card ${
                    selectedAccount.netBalance >= 0
                      ? "border-success"
                      : "border-danger"
                  }`}
                >
                  <h4 className="info-card-title text-main">
                    {t("currentNetBalance")}
                  </h4>
                  <div
                    className={`massive-amount ${
                      selectedAccount.netBalance >= 0
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {selectedAccount.netBalance > 0 ? "+" : ""}
                    {selectedAccount.netBalance.toLocaleString()}{" "}
                    {selectedAccount.currency}
                  </div>
                  <p className="helper-text mt-2">
                    {selectedAccount.netBalance >= 0
                      ? t("positiveBalance")
                      : t("negativeBalance")}
                  </p>
                </div>
              </div>
              <div className="transactions-section">
                <div className="transactions-header">
                  <h4>{t("transactionHistory")}</h4>
                  <button
                    className="action-btn submit-btn auto-width"
                    onClick={() => setIsTransactionModalOpen(true)}
                  >
                    {t("addTransaction")}
                  </button>
                </div>
                <div className="table-wrapper">
                  <table className="hawala-table">
                    <thead>
                      <tr>
                        <th>{t("date")}</th>
                        <th>{t("transactionId")}</th>
                        <th>{t("description")}</th>
                        <th>{t("type")}</th>
                        <th style={{ textAlign: "right" }}>{t("amount")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAccount.transactions.map((txn) => (
                        <tr key={txn.id}>
                          <td>{txn.date}</td>
                          <td className="text-light">{txn.id}</td>
                          <td>{txn.description}</td>
                          <td>
                            <span
                              className={`status-badge ${
                                txn.type === "Credit" ? "paid" : "pending"
                              }`}
                            >
                              {txn.type}
                            </span>
                          </td>
                          <td
                            className={`fw-bold ${
                              txn.type === "Credit"
                                ? "text-success"
                                : "text-danger"
                            }`}
                            style={{ textAlign: "right" }}
                          >
                            {txn.type === "Credit" ? "+" : "-"}
                            {txn.amount.toLocaleString()}{" "}
                            {selectedAccount.currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div
              className="modal-footer sticky-footer"
              style={{ justifyContent: "space-between" }}
            >
              <div>
                {(currentUserRole === ROLES.MANAGER ||
                  currentUserRole === ROLES.OWNER) && (
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      type="button"
                      className="action-btn danger auto-width"
                      onClick={() => handleDeleteAccount(selectedAccount)}
                    >
                      {t("deleteAccount")}
                    </button>
                    <button
                      type="button"
                      className="action-btn auto-width"
                      onClick={() => handleStartEdit(selectedAccount)}
                    >
                      {t("editDetails")}
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="action-btn secondary auto-width"
                  onClick={closeViewModal}
                >
                  {t("closeLedger")}
                </button>
                <button type="button" className="action-btn auto-width">
                  {t("downloadPdfReport")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD NEW TRANSACTION TO LEDGER --- */}
      {isTransactionModalOpen && selectedAccount && (
        <div
          className="modal-overlay"
          onClick={() => setIsTransactionModalOpen(false)}
          style={{ zIndex: 1001 }}
        >
          <div
            className="modal-content small-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{t("recordTransaction")}</h3>
              <button
                className="close-btn"
                onClick={() => setIsTransactionModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddTransaction}>
              <div
                className="modal-body padded-body"
                style={{ display: "block" }}
              >
                <p className="helper-text mb-4">
                  {t("addingRecordTo")}{" "}
                  <strong>{selectedAccount.name}'s</strong> {t("ledger")}.
                </p>
                <div className="form-input-group mb-3">
                  <label>{t("transactionType")}</label>
                  <select required>
                    <option value="">{t("selectType")}</option>
                    <option value="credit">{t("creditAddFunds")}</option>
                    <option value="debit">{t("debitDeductFunds")}</option>
                  </select>
                </div>
                <div className="form-input-group mb-3">
                  <label>
                    {t("amount")} ({selectedAccount.currency})
                  </label>
                  <input type="number" required placeholder="0.00" />
                </div>
                <div className="form-input-group mb-3">
                  <label>{t("date")}</label>
                  <input
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="form-input-group">
                  <label>{t("idDocument")}</label>
                  <textarea
                    type="text"
                    required
                    placeholder={t("transactionDescriptionPlaceholder")}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="action-btn secondary auto-width"
                  onClick={() => setIsTransactionModalOpen(false)}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="action-btn submit-btn auto-width"
                >
                  {t("saveRecord")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: CREATE NEW KAHATA ACCOUNT --- */}
      {isNewAccountModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsNewAccountModalOpen(false)}
        >
          <div
            className="modal-content small-modal"
            onClick={(e) => e.stopPropagation()}
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
              <div
                className="modal-body padded-body"
                style={{ display: "block" }}
              >
                <div className="form-input-group mb-3">
                  <label>{t("accountNameBusinessName")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("accountNamePlaceholder")}
                  />
                </div>
                <div className="form-input-group mb-3">
                  <label>{t("accountType")}</label>
                  <select required>
                    <option value="">{t("selectCategory")}</option>
                    <option value="Partner Sarafi">{t("partnerSarafi")}</option>
                    <option value="Merchant Customer">
                      {t("merchantCustomer")}
                    </option>
                  </select>
                </div>
                <div className="form-input-group mb-3">
                  <label>{t("baseCurrency")}</label>
                  <select required>
                    <option value="AFN">Afghani (AFN)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="PKR">Pakistani Rupee (PKR)</option>
                  </select>
                </div>
                <div className="form-input-group mb-3">
                  <label>{t("phoneNumber")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("phoneNumberPlaceholder")}
                  />
                </div>
                <div className="form-input-group">
                  <label>{t("businessHomeAddress")}</label>
                  <input
                    type="text"
                    required
                    placeholder={t("addressPlaceholder")}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="action-btn secondary auto-width"
                  onClick={() => setIsNewAccountModalOpen(false)}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="action-btn submit-btn auto-width"
                >
                  {t("openAccount")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 4: EDIT KAHATA ACCOUNT DETAILS --- */}
      {editingAccount && (
        <div className="modal-overlay" onClick={() => setEditingAccount(null)}>
          <div
            className="modal-content small-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                {t("editKahata")}: {editingAccount.name}
              </h3>
              <button
                className="close-btn"
                onClick={() => setEditingAccount(null)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={submitEditedAccount}>
              <div
                className="modal-body padded-body"
                style={{ display: "block" }}
              >
                <p className="helper-text mb-4">
                  {t("editingCoreDetails")} <strong>{editingAccount.id}</strong>
                  .
                </p>
                <div className="form-input-group mb-3">
                  <label>{t("accountNameBusinessName")}</label>
                  <input
                    type="text"
                    required
                    value={editingAccount.name}
                    onChange={(e) => handleEditChange("name", e.target.value)}
                  />
                </div>
                <div className="form-input-group mb-3">
                  <label>{t("accountType")}</label>
                  <select
                    required
                    value={editingAccount.type}
                    onChange={(e) => handleEditChange("type", e.target.value)}
                  >
                    <option value="Partner Sarafi">{t("partnerSarafi")}</option>
                    <option value="Merchant Customer">
                      {t("merchantCustomer")}
                    </option>
                  </select>
                </div>
                <div className="form-input-group mb-3">
                  <label>{t("phoneNumber")}</label>
                  <input
                    type="text"
                    required
                    value={editingAccount.phone}
                    onChange={(e) => handleEditChange("phone", e.target.value)}
                  />
                </div>
                <div className="form-input-group">
                  <label>{t("businessHomeAddress")}</label>
                  <input
                    type="text"
                    required
                    value={editingAccount.address}
                    onChange={(e) =>
                      handleEditChange("address", e.target.value)
                    }
                  />
                </div>

                {(currentUserRole === ROLES.MANAGER ||
                  currentUserRole === ROLES.OWNER) && (
                  <div className="form-input-group mt-4 warning-box">
                    <label>
                      {t("adjustNetBalance")} ({editingAccount.currency})
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={editingAccount.netBalance}
                      onChange={(e) =>
                        handleEditChange(
                          "netBalance",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                    <p className="helper-text mt-2">
                      <strong>{t("warning")}:</strong> {t("balanceWarning")}
                    </p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="action-btn secondary auto-width"
                  onClick={() => setEditingAccount(null)}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="action-btn submit-btn auto-width"
                >
                  {t("saveChanges")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
