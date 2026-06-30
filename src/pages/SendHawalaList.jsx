import React, { useState } from "react";
import "./SendHawalaList.css";
import { getRole, ROLES } from "../utils/auth";
import { useLanguage } from "../context/LanguageContext";

export default function SendHawalaList() {
  const { t } = useLanguage();
  const [selectedHawala, setSelectedHawala] = useState(null);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [editingHawala, setEditingHawala] = useState(null);

  // Read the current user's role from the shared auth utility
  const currentUserRole = getRole() || ROLES.EMPLOYEE;

  // States for the Send Form
  const [searchQuery, setSearchQuery] = useState("");
  const [foundSender, setFoundSender] = useState(null);
  const [isNewSender, setIsNewSender] = useState(false);

  // States for Funding Source (Provider)
  const [fundingSource, setFundingSource] = useState("sarafi");
  const [selectedKahataId, setSelectedKahataId] = useState("");

  const getFormattedCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const formattedHours = String(hours).padStart(2, "0");
    return `${year}-${month}-${day} ${formattedHours}:${minutes} ${ampm}`;
  };

  const [sentHawalas, setSentHawalas] = useState([
    {
      id: "SHW-5011",
      date: "2026-06-29 09:00 AM", // Older than 15 mins for testing
      destinationBranch: "Herat Main",
      senderName: "Omar",
      senderFather: "Hassan",
      senderPhone: "0771112222",
      senderIdNum: "1401-999-1111",
      senderIdImageUrl:
        "https://placehold.co/600x400/e2e8f0/64748b?text=Sender+Tazkira",
      receiverName: "Farooq",
      receiverFather: "Jalal",
      receiverPhone: "0799123456",
      receiverExpectedId: "P-1234567",
      receiverIdImageUrl:
        "https://placehold.co/600x400/e2e8f0/64748b?text=Receiver+Tazkira",
      amount: "15,000",
      currency: "AFN",
      fee: "150",
      status: "Sent - Pending Payout",
    },
    {
      id: "SHW-5012",
      date: "2026-06-29 10:45 AM", // Older than 15 mins for testing
      destinationBranch: "Dubai Branch",
      senderName: "Zalmay",
      senderFather: "Tariq",
      senderPhone: "0700987654",
      senderIdNum: "P-9921834",
      senderIdImageUrl:
        "https://placehold.co/600x400/e2e8f0/64748b?text=Sender+Passport",
      receiverName: "Wali",
      receiverFather: "Qasim",
      receiverPhone: "+971501234567",
      receiverExpectedId: "E-998877",
      receiverIdImageUrl:
        "https://placehold.co/600x400/e2e8f0/64748b?text=Receiver+Passport",
      amount: "5,000",
      currency: "USD",
      fee: "25",
      status: "Paid Out",
    },
    {
      id: "SHW-5013",
      date: getFormattedCurrentDate(), // Within 15 mins for testing
      destinationBranch: "Kabul Branch",
      senderName: "Ahmad",
      senderFather: "Mahmoud",
      senderPhone: "0799000111",
      senderIdNum: "1401-233-4902",
      senderIdImageUrl:
        "https://placehold.co/600x400/e2e8f0/64748b?text=Sender+Tazkira",
      receiverName: "Qais",
      receiverFather: "Zubair",
      receiverPhone: "0777888999",
      receiverExpectedId: "P-555555",
      receiverIdImageUrl:
        "https://placehold.co/600x400/e2e8f0/64748b?text=Receiver+Tazkira",
      amount: "10,000",
      currency: "AFN",
      fee: "100",
      status: "Sent - Pending Payout",
    },
  ]);

  const isWithinEditWindow = (dateString) => {
    const standardizedDateStr = dateString.replace(/-/g, "/");
    const creationTime = new Date(standardizedDateStr).getTime();
    const currentTime = new Date().getTime();
    const diffInMinutes = (currentTime - creationTime) / (1000 * 60);
    return diffInMinutes >= 0 && diffInMinutes <= 15;
  };

  const handleRowClick = (hawala) => setSelectedHawala(hawala);
  const closeViewModal = () => {
    setSelectedHawala(null);
    setIsImageZoomed(false);
  };

  const closeSendModal = () => {
    setIsSendModalOpen(false);
    setSearchQuery("");
    setFoundSender(null);
    setIsNewSender(false);
    setFundingSource("sarafi");
    setSelectedKahataId("");
  };

  const handleSendHawala = (e) => {
    e.preventDefault();
    if (fundingSource === "kahata" && !selectedKahataId) {
      alert(t("selectKahataError"));
      return;
    }
    let sourceText =
      fundingSource === "sarafi"
        ? t("mainSafeLabel")
        : `${t("kahataLabel")} (${selectedKahataId})`;
    alert(`${t("recordedHawalaMessage")} ${sourceText}`);
    closeSendModal();
  };

  const handleSearchSender = (e) => {
    e.preventDefault();
    if (searchQuery === "0700987654" || searchQuery === "P-9921834") {
      setFoundSender({
        name: "Zalmay",
        father: "Tariq",
        phone: "0700987654",
        idNum: "P-9921834",
        address: "Mazar-e-Sharif",
      });
      setIsNewSender(false);
    } else {
      setFoundSender(null);
      setIsNewSender(true);
    }
  };

  const handleDeleteHawala = (id) => {
    // MODIFIED: Added role check for logging purposes (optional but good practice)
    const isOverride =
      selectedHawala &&
      !isWithinEditWindow(selectedHawala.date) &&
      (currentUserRole === ROLES.MANAGER || currentUserRole === ROLES.OWNER);
    const confirmationMessage = isOverride
      ? `${t("managerOverride")} ${id}? ${t("outsideWindow")}`
      : `${t("deleteConfirmation")} ${id}?`;

    if (window.confirm(confirmationMessage)) {
      setSentHawalas(sentHawalas.filter((h) => h.id !== id));
      console.log(
        `Hawala ${id} deleted by ${currentUserRole}. Override: ${isOverride}`,
      );
      closeViewModal();
    }
  };

  const handleEditHawala = (id) => {
    const hawalaToEdit = sentHawalas.find((h) => h.id === id);
    if (hawalaToEdit) {
      setEditingHawala({ ...hawalaToEdit });
      closeViewModal();
    }
  };

  const handleEditChange = (field, value) => {
    setEditingHawala((prev) => ({ ...prev, [field]: value }));
  };

  const submitEditedHawala = (e) => {
    e.preventDefault();
    setSentHawalas((prevHawalas) =>
      prevHawalas.map((h) => (h.id === editingHawala.id ? editingHawala : h)),
    );
    setEditingHawala(null);
    alert(`Hawala ${editingHawala.id} ${t("hawalaUpdated")}`);
  };

  // Role switching is handled globally in the Sidebar/App; read-only here.

  return (
    <div className="list-container">
      <div className="list-header">
        <h2 className="section-title">{t("sentHawalasLog")}</h2>
        <div className="header-actions-group">
          <div className="search-bar">
            <input type="text" placeholder={t("searchNameOrId")} />
            <button className="search-btn">{t("search")}</button>
          </div>
          <button
            className="action-btn submit-btn fw-bold"
            onClick={() => setIsSendModalOpen(true)}
          >
            {t("draftNewHawalaButton")}
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="hawala-table">
          {/* Table Head remains the same */}
          <thead>
            <tr>
              <th>{t("hawalaId")}</th>
              <th>{t("dateSent")}</th>
              <th>{t("destination")}</th>
              <th>{t("senderCustomer")}</th>
              <th>{t("receiver")}</th>
              <th>{t("amount")}</th>
              <th>{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {sentHawalas.map((hawala) => (
              <tr
                key={hawala.id}
                onClick={() => handleRowClick(hawala)}
                className="clickable-row"
              >
                <td className="fw-bold">{hawala.id}</td>
                <td>{hawala.date.split(" ")[0]}</td>
                <td>{hawala.destinationBranch}</td>
                <td className="fw-bold">{hawala.senderName}</td>
                <td>{hawala.receiverName}</td>
                <td className="amount-col">
                  {hawala.amount} {hawala.currency}
                </td>
                <td>
                  <span
                    className={`status-badge ${
                      hawala.status.includes("Paid") ? "paid" : "pending"
                    }`}
                  >
                    {hawala.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- MODAL 1: VIEW SENT HAWALA DETAILS --- */}
      {selectedHawala &&
        (() => {
          // --- MODIFIED: Define access rights based on role ---
          const isManagerOrOwner =
            currentUserRole === ROLES.MANAGER ||
            currentUserRole === ROLES.OWNER;
          const withinWindow = isWithinEditWindow(selectedHawala.date);
          const canPerformActions = withinWindow || isManagerOrOwner;
          const isManagerOverride = !withinWindow && isManagerOrOwner;

          return (
            <div className="modal-overlay" onClick={closeViewModal}>
              <div
                className="modal-content view-modal"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header and Body remains the same */}
                <div className="modal-header">
                  <h3>
                    {t("sentHawalaDetails")}: {selectedHawala.id}
                  </h3>
                  <button className="close-btn" onClick={closeViewModal}>
                    &times;
                  </button>
                </div>
                <div className="modal-body modal-body-split">
                  <div className="info-column">
                    <div className="info-card">
                      <h4 className="info-card-title">
                        {t("senderInformationCustomer")}
                      </h4>
                      <p className="info-row">
                        <strong>{t("fullName")}:</strong>{" "}
                        {selectedHawala.senderName}
                      </p>
                      <p className="info-row">
                        <strong>{t("father")}:</strong>{" "}
                        {selectedHawala.senderFather}
                      </p>
                      <p className="info-row">
                        <strong>{t("phoneNumber")}:</strong>{" "}
                        {selectedHawala.senderPhone}
                      </p>
                      <p className="info-row">
                        <strong>{t("customerIdTazkira")}:</strong>{" "}
                        {selectedHawala.senderIdNum}
                      </p>
                    </div>
                    <div className="detail-group">
                      <div className="id-header">
                        <h4>{t("receiverOfficialId")}</h4>
                        <span
                          className="enlarge-btn"
                          onClick={() => setIsImageZoomed(true)}
                        >
                          🔍 {t("enlarge")}
                        </span>
                      </div>
                      <div
                        className="id-preview-box"
                        onClick={() => setIsImageZoomed(true)}
                      >
                        <img
                          src={
                            selectedHawala.receiverIdImageUrl ||
                            "https://placehold.co/600x400/e2e8f0/64748b?text=Pending+Receiver+ID"
                          }
                          alt="Receiver ID"
                        />
                      </div>
                      <small className="helper-text mt-2">
                        {selectedHawala.status.includes("Paid")
                          ? t("capturedAtDestination")
                          : t("awaitingPayoutCapture")}
                      </small>
                    </div>
                  </div>
                  <div className="info-column">
                    <div className="payout-highlight-card">
                      <h4 className="text-light">{t("sentAmount")}</h4>
                      <div className="massive-amount text-main">
                        {selectedHawala.amount} {selectedHawala.currency}
                      </div>
                      <p className="fee-text">
                        {t("commissionFee")}: {selectedHawala.fee}{" "}
                        {selectedHawala.currency}
                      </p>
                    </div>
                    <div className="info-card bg-white">
                      <h4 className="info-card-title">
                        {t("destinationAndReceiver")}
                      </h4>
                      <p className="info-row">
                        <strong>{t("toBranch")}:</strong>{" "}
                        <span className="branch-highlight">
                          {selectedHawala.destinationBranch}
                        </span>
                      </p>
                      <p className="info-row">
                        <strong>{t("expectedReceiver")}:</strong>{" "}
                        {selectedHawala.receiverName}
                      </p>
                      <p className="info-row">
                        <strong>{t("receiverFather")}:</strong>{" "}
                        {selectedHawala.receiverFather}
                      </p>
                      <p className="info-row">
                        <strong>{t("receiverPhone")}:</strong>{" "}
                        {selectedHawala.receiverPhone}
                      </p>
                      <p className="info-row">
                        <strong>{t("expectedId")}:</strong>{" "}
                        {selectedHawala.receiverExpectedId}
                      </p>
                    </div>
                    <div className="timestamp-text">
                      {t("sentOn")}: {selectedHawala.date}
                    </div>
                  </div>
                </div>

                {/* --- MODIFIED: VIEW FOOTER WITH ROLE-BASED LOGIC --- */}
                <div
                  className="modal-footer sticky-footer"
                  style={{ justifyContent: "space-between" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    {canPerformActions ? (
                      <>
                        <button
                          className="action-btn danger auto-width"
                          onClick={() => handleDeleteHawala(selectedHawala.id)}
                        >
                          {t("delete")}
                        </button>
                        <button
                          className="action-btn auto-width"
                          onClick={() => handleEditHawala(selectedHawala.id)}
                        >
                          {t("editDetails")}
                        </button>
                        {isManagerOverride && (
                          <span
                            className="helper-text warning-text"
                            style={{ width: "350px" }}
                          >
                            ⚠️ {t("managerOverrideEnabled")}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="helper-text">
                        🔒 {t("editWindowClosed")}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="action-btn secondary auto-width"
                    onClick={closeViewModal}
                  >
                    {t("closeView")}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* --- MODAL 2: DRAFT NEW HAWALA (No changes needed here) --- */}
      {isSendModalOpen && (
        <div className="modal-overlay" onClick={closeSendModal}>
          {/* Content of this modal is unchanged */}
          <div
            className="modal-content draft-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "1000px" }}
          >
            <div className="modal-header sticky-header">
              <h3>{t("draftAndSendHawala")}</h3>
              <button className="close-btn" onClick={closeSendModal}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSendHawala}>
              <div
                className="modal-body padded-body"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "2rem",
                }}
              >
                {/* --- LEFT COLUMN --- */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2rem",
                  }}
                >
                  {/* STEP 1: SENDER */}
                  <div>
                    <h4 className="step-header">
                      {t("stepOneIdentifySender")}
                    </h4>

                    <div
                      className="search-box dual-search"
                      style={{ marginBottom: "1rem" }}
                    >
                      <input
                        type="text"
                        placeholder={t("searchSenderPhoneOrId")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <button
                        type="button"
                        className="action-btn"
                        onClick={handleSearchSender}
                      >
                        {t("searchProfile")}
                      </button>
                    </div>

                    {foundSender && (
                      <div className="found-customer-card">
                        <div>
                          <h4 className="success-text">
                            {t("verifiedCustomer")}
                          </h4>
                          <div
                            className="customer-details-row"
                            style={{
                              gap: "1rem",
                              flexDirection: "column",
                              marginTop: "0.5rem",
                            }}
                          >
                            <span>
                              <strong>{t("nameLabel")}:</strong>{" "}
                              {foundSender.name}
                            </span>
                            <span>
                              <strong>{t("phoneNumber")}:</strong>{" "}
                              {foundSender.phone}
                            </span>
                            <span>
                              <strong>{t("idLabel")}:</strong>{" "}
                              {foundSender.idNum}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="action-btn secondary auto-width"
                          onClick={() => setFoundSender(null)}
                        >
                          {t("clear")}
                        </button>
                      </div>
                    )}

                    {isNewSender && (
                      <div
                        className="new-customer-card"
                        style={{ padding: "1rem" }}
                      >
                        <h4
                          className="danger-text"
                          style={{ fontSize: "0.9rem", marginBottom: "1rem" }}
                        >
                          {t("senderNotFoundRegisterNewCustomer")}
                        </h4>

                        <div
                          className="upload-section"
                          style={{ marginBottom: "1rem" }}
                        >
                          <label
                            className="input-label"
                            style={{ fontSize: "0.85rem" }}
                          >
                            {t("senderIdUploadRequired")}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            required
                            className="file-input"
                          />
                        </div>

                        <div className="form-grid-2" style={{ gap: "0.5rem" }}>
                          <div className="form-input-group">
                            <label>{t("fullName")}</label>
                            <input type="text" required />
                          </div>
                          <div className="form-input-group">
                            <label>{t("fathersName")}</label>
                            <input type="text" required />
                          </div>
                          <div className="form-input-group">
                            <label>{t("idTazkira")}</label>
                            <input type="text" required />
                          </div>
                          <div className="form-input-group">
                            <label>{t("mobileNumber")}</label>
                            <input type="text" required />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STEP 3: RECEIVER */}
                  <div>
                    <h4 className="step-header">
                      {t("stepThreeTargetReceiver")}
                    </h4>
                    <p className="helper-text" style={{ marginBottom: "1rem" }}>
                      {t("receiverDetailsGuidance")}
                    </p>
                    <div
                      className="form-grid-2"
                      style={{ marginBottom: "1rem", gap: "0.75rem" }}
                    >
                      <div className="form-input-group">
                        <label>{t("expectedReceiverName")}</label>
                        <input type="text" required />
                      </div>
                      <div className="form-input-group">
                        <label>{t("receiverFatherName")}</label>
                        <input type="text" required />
                      </div>
                      <div className="form-input-group">
                        <label>{t("receiverMobileNumber")}</label>
                        <input type="text" required />
                      </div>
                      <div className="form-input-group">
                        <label>{t("expectedIdTazkira")}</label>
                        <input
                          type="text"
                          required
                          placeholder={t("required")}
                        />
                      </div>
                    </div>

                    <div className="upload-section">
                      <label
                        className="input-label"
                        style={{ fontSize: "0.85rem" }}
                      >
                        {t("receiverIdImageOptional")}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="file-input"
                      />
                    </div>
                  </div>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2rem",
                  }}
                >
                  {/* STEP 2: TRANSFER */}
                  <div>
                    <h4 className="step-header">
                      {t("stepTwoTransferDetails")}
                    </h4>
                    <div
                      className="form-grid-3 styled-grid-box"
                      style={{ padding: "1.25rem", gap: "0.75rem" }}
                    >
                      <div className="form-input-group">
                        <label>{t("destinationBranch")}</label>
                        <select required>
                          <option value="">
                            {t("selectBranchPlaceholder")}
                          </option>
                          <option value="Mazar">Mazar-e-Sharif Main</option>
                          <option value="Herat">Herat Branch</option>
                          <option value="Kabul Branch">Kabul Branch</option>
                          <option value="Dubai Branch">Dubai Central</option>
                        </select>
                      </div>
                      <div className="form-input-group">
                        <label>{t("transferAmount")}</label>
                        <input
                          type="number"
                          required
                          placeholder={t("amountPlaceholder")}
                        />
                      </div>
                      <div className="form-input-group">
                        <label>{t("currency")}</label>
                        <select required>
                          <option value="AFN">Afghani (AFN)</option>
                          <option value="USD">US Dollar (USD)</option>
                          <option value="PKR">Pakistani Rupee (PKR)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* STEP 4: FUNDING SOURCE */}
                  <div>
                    <h4 className="step-header">
                      {t("stepFourFundingSource")}
                    </h4>
                    <div
                      className="styled-grid-box"
                      style={{ padding: "1.25rem" }}
                    >
                      <div
                        className="form-input-group"
                        style={{ marginBottom: "1.5rem" }}
                      >
                        <label>{t("selectOriginOfFunds")}</label>
                        <div
                          style={{
                            display: "flex",
                            gap: "1.5rem",
                            marginTop: "0.75rem",
                          }}
                        >
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              cursor: "pointer",
                              fontWeight: "normal",
                              color: "var(--text-main)",
                            }}
                          >
                            <input
                              type="radio"
                              name="fundingSource"
                              value="sarafi"
                              checked={fundingSource === "sarafi"}
                              onChange={() => setFundingSource("sarafi")}
                              style={{
                                width: "1.25rem",
                                height: "1.25rem",
                                cursor: "pointer",
                              }}
                            />
                            {t("sarafiCashSafe")}
                          </label>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              cursor: "pointer",
                              fontWeight: "normal",
                              color: "var(--text-main)",
                            }}
                          >
                            <input
                              type="radio"
                              name="fundingSource"
                              value="kahata"
                              checked={fundingSource === "kahata"}
                              onChange={() => setFundingSource("kahata")}
                              style={{
                                width: "1.25rem",
                                height: "1.25rem",
                                cursor: "pointer",
                              }}
                            />
                            {t("kahataLedger")}
                          </label>
                        </div>
                      </div>

                      {fundingSource === "sarafi" ? (
                        <div
                          style={{
                            backgroundColor: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            padding: "1rem",
                            borderRadius: "6px",
                          }}
                        >
                          <p
                            style={{
                              color: "var(--success)",
                              margin: 0,
                              fontSize: "0.9rem",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <span style={{ fontSize: "1.25rem" }}>✓</span>{" "}
                            {t("fundsWillBeDeducted")}
                          </p>
                        </div>
                      ) : (
                        <div
                          className="form-input-group"
                          style={{ animation: "fadeIn 0.3s ease-in-out" }}
                        >
                          <label>{t("selectCustomerPartnerKahata")}</label>
                          <select
                            required
                            value={selectedKahataId}
                            onChange={(e) =>
                              setSelectedKahataId(e.target.value)
                            }
                            style={{
                              backgroundColor: "#fffbeb",
                              borderColor: "#fcd34d",
                            }}
                          >
                            <option value="">{t("chooseAccount")}</option>
                            <option value="KHT-8001">
                              Haji Abdul Rahman (AFN)
                            </option>
                            <option value="KHT-8002">
                              Zamani Electronics (USD)
                            </option>
                            <option value="KHT-8005">
                              Farhad Traders (AFN)
                            </option>
                          </select>
                          <p
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-light)",
                              marginTop: "0.5rem",
                            }}
                          >
                            {t("transferAmountRecordedAsDebit")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer sticky-footer">
                <button
                  type="button"
                  className="action-btn secondary auto-width"
                  onClick={closeSendModal}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="action-btn submit-btn big-btn auto-width"
                  disabled={!foundSender && !isNewSender}
                  style={{ opacity: !foundSender && !isNewSender ? 0.5 : 1 }}
                >
                  {t("generateAndSendHawala")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: EDIT HAWALA DETAILS --- */}
      {editingHawala && (
        <div className="modal-overlay" onClick={() => setEditingHawala(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "800px" }}
          >
            <div className="modal-header sticky-header">
              <h3>
                {t("editHawalaDetails")}: {editingHawala.id}
              </h3>
              <button
                className="close-btn"
                onClick={() => setEditingHawala(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={submitEditedHawala}>
              <div
                className="modal-body padded-body"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                {/* --- MODIFIED: Dynamic helper text for edit modal --- */}
                {!isWithinEditWindow(editingHawala.date) &&
                (currentUserRole === ROLES.MANAGER ||
                  currentUserRole === ROLES.OWNER) ? (
                  <p
                    className="helper-text warning-text"
                    style={{
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fcd34d",
                      padding: "0.75rem",
                      borderRadius: "4px",
                    }}
                  >
                    <strong>{t("managerOverride")}:</strong>{" "}
                    {t("editWindowClosed")}
                  </p>
                ) : (
                  <p className="helper-text">{t("editWindowMessage")}</p>
                )}

                <h4 className="step-header" style={{ marginBottom: "0" }}>
                  {t("transferDetails")}
                </h4>
                <div className="form-grid-2">
                  <div className="form-input-group">
                    <label>{t("destinationBranch")}</label>
                    <select
                      required
                      value={editingHawala.destinationBranch}
                      onChange={(e) =>
                        handleEditChange("destinationBranch", e.target.value)
                      }
                    >
                      <option value="Mazar-e-Sharif Main">
                        Mazar-e-Sharif Main
                      </option>
                      <option value="Herat Main">Herat Main</option>
                      <option value="Kabul Branch">Kabul Branch</option>
                      <option value="Dubai Branch">Dubai Central</option>
                    </select>
                  </div>
                  <div className="form-input-group">
                    <label>{t("currency")}</label>
                    <select
                      required
                      value={editingHawala.currency}
                      onChange={(e) =>
                        handleEditChange("currency", e.target.value)
                      }
                    >
                      <option value="AFN">Afghani (AFN)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="PKR">Pakistani Rupee (PKR)</option>
                    </select>
                  </div>
                  <div className="form-input-group">
                    <label>
                      {t("transferAmount")} ({t("rawNumber")})
                    </label>
                    <input
                      type="text"
                      required
                      value={editingHawala.amount}
                      onChange={(e) =>
                        handleEditChange("amount", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-input-group">
                    <label>{t("commissionFee")}</label>
                    <input
                      type="text"
                      required
                      value={editingHawala.fee}
                      onChange={(e) => handleEditChange("fee", e.target.value)}
                    />
                  </div>
                </div>

                <h4
                  className="step-header"
                  style={{ marginBottom: "0", marginTop: "1rem" }}
                >
                  {t("receiverDetails")}
                </h4>
                <div className="form-grid-2">
                  <div className="form-input-group">
                    <label>{t("receiverName")}</label>
                    <input
                      type="text"
                      required
                      value={editingHawala.receiverName}
                      onChange={(e) =>
                        handleEditChange("receiverName", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-input-group">
                    <label>{t("receiverFatherName")}</label>
                    <input
                      type="text"
                      required
                      value={editingHawala.receiverFather}
                      onChange={(e) =>
                        handleEditChange("receiverFather", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-input-group">
                    <label>{t("receiverPhone")}</label>
                    <input
                      type="text"
                      required
                      value={editingHawala.receiverPhone}
                      onChange={(e) =>
                        handleEditChange("receiverPhone", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-input-group">
                    <label>{t("expectedIdTazkira")}</label>
                    <input
                      type="text"
                      required
                      value={editingHawala.receiverExpectedId}
                      onChange={(e) =>
                        handleEditChange("receiverExpectedId", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer sticky-footer">
                <button
                  type="button"
                  className="action-btn secondary auto-width"
                  onClick={() => setEditingHawala(null)}
                >
                  {t("cancelEdit")}
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

      {/* --- Fullscreen Image Zoom Overlay --- */}
      {isImageZoomed && selectedHawala && (
        <div
          className="fullscreen-overlay"
          onClick={() => setIsImageZoomed(false)}
        >
          <img
            src={
              selectedHawala.receiverIdImageUrl ||
              "https://placehold.co/1200x800/e2e8f0/64748b?text=Pending+Receiver+ID"
            }
            alt="Zoomed ID Document"
            className="fullscreen-image"
          />
          <button
            className="fullscreen-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsImageZoomed(false);
            }}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
