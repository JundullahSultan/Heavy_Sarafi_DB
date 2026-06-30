import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import "./ReceivedHawalaList.css";

export default function ReceivedHawalaList() {
  const { t } = useLanguage();
  const [selectedHawala, setSelectedHawala] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const [hawalas] = useState([
    {
      id: "HW-9021",
      date: "2026-06-28 10:15 AM",
      senderBranch: "Herat Main",
      senderName: "Farooq",
      senderPhone: "0799123456",
      receiverName: "Ahmad Khan",
      receiverFather: "Mahmoud",
      receiverIdNum: "1401-233-4902",
      amount: "50,000",
      currency: "AFN",
      status: "Pending",
      idImageUrl:
        "https://placehold.co/1000x600/e2e8f0/64748b?text=High+Res+Tazkira+Image",
    },
    {
      id: "HW-9022",
      date: "2026-06-28 11:30 AM",
      senderBranch: "Mazar Branch",
      senderName: "Wali",
      senderPhone: "0700987654",
      receiverName: "Zalmay",
      receiverFather: "Tariq",
      receiverIdNum: "P-9921834",
      amount: "1,200",
      currency: "USD",
      status: "Pending",
      idImageUrl:
        "https://placehold.co/1000x600/e2e8f0/64748b?text=High+Res+Passport+Image",
    },
    {
      id: "HW-9022",
      date: "2026-06-28 11:30 AM",
      senderBranch: "Mazar Branch",
      senderName: "Wali",
      senderPhone: "0700987654",
      receiverName: "Zalmay",
      receiverFather: "Tariq",
      receiverIdNum: "P-9921834",
      amount: "1,200",
      currency: "USD",
      status: "Pending",
      idImageUrl:
        "https://placehold.co/1000x600/e2e8f0/64748b?text=High+Res+Passport+Image",
    },
    {
      id: "HW-9022",
      date: "2026-06-28 11:30 AM",
      senderBranch: "Mazar Branch",
      senderName: "Wali",
      senderPhone: "0700987654",
      receiverName: "Zalmay",
      receiverFather: "Tariq",
      receiverIdNum: "P-9921834",
      amount: "1,200",
      currency: "USD",
      status: "Pending",
      idImageUrl:
        "https://placehold.co/1000x600/e2e8f0/64748b?text=High+Res+Passport+Image",
    },
  ]);

  const handleRowClick = (hawala) => {
    setSelectedHawala(hawala);
  };

  const closeModal = () => {
    setSelectedHawala(null);
    setSearchQuery("");
    setFoundCustomer(null);
    setIsNewCustomer(false);
    setIsImageZoomed(false);
  };

  const handlePayout = () => {
    alert(
      `${t("settingsSaved")} Hawala ${selectedHawala.id} ${t("markedAsPaid")}.`,
    );
    closeModal();
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <h2 className="section-title">{t("receivedHawalaQueue")}</h2>
        <div className="search-bar">
          <input type="text" placeholder={t("searchByNameOrId")} />
          <button className="search-btn">{t("search")}</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="hawala-table">
          <thead>
            <tr>
              <th>{t("hawalaId")}</th>
              <th>{t("date")}</th>
              <th>{t("fromBranch")}</th>
              <th>{t("receiverName")}</th>
              <th>{t("amount")}</th>
              <th>{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {hawalas.map((hawala) => (
              <tr
                key={hawala.id}
                onClick={() => handleRowClick(hawala)}
                className="clickable-row"
              >
                <td data-label={t("hawalaId")} className="fw-bold">
                  {hawala.id}
                </td>
                <td data-label={t("date")}>{hawala.date.split(" ")[0]}</td>
                <td data-label={t("fromBranch")}>{hawala.senderBranch}</td>
                <td data-label={t("receiverName")} className="fw-bold">
                  {hawala.receiverName}
                </td>
                <td data-label={t("amount")} className="amount-col">
                  {hawala.amount} {hawala.currency}
                </td>
                <td data-label={t("status")}>
                  <span className="status-badge pending">{hawala.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedHawala && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {t("hawalaDetails")}: {selectedHawala.id}
              </h3>
              <button className="close-btn" onClick={closeModal}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              {/* Left Column: Details */}
              <div className="details-column">
                {/* Sender Card */}
                <div className="detail-card">
                  <h4>{t("senderInformation")}</h4>
                  <div className="detail-row">
                    <span className="label">{t("fullName")}</span>
                    <span className="value">{selectedHawala.senderName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">{t("branch")}</span>
                    <span className="value">{selectedHawala.senderBranch}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">{t("phoneNumber")}</span>
                    <span className="value">{selectedHawala.senderPhone}</span>
                  </div>
                </div>

                {/* Receiver Card */}
                <div className="detail-card">
                  <h4>{t("recordedReceiverDetails")}</h4>
                  <div className="detail-row">
                    <span className="label">{t("expectedReceiver")}</span>
                    <span className="value">{selectedHawala.receiverName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">{t("fathersName")}</span>
                    <span className="value">
                      {selectedHawala.receiverFather}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">{t("idTazkira")}</span>
                    <span className="value">
                      {selectedHawala.receiverIdNum}
                    </span>
                  </div>
                </div>

                {/* ID Image */}
                <div className="detail-card">
                  <h4>{t("idDocument")}</h4>
                  <div
                    className="id-image-wrapper"
                    onClick={() => setIsImageZoomed(true)}
                  >
                    <img
                      src={selectedHawala.idImageUrl}
                      alt="Receiver ID Document"
                    />
                  </div>
                  <div className="image-hint">{t("clickImageToEnlarge")}</div>
                </div>

                {/* Payout Amount */}
                <div className="detail-card payout-amount">
                  <h4>{t("payoutAmount")}</h4>
                  <div className="massive-amount">
                    {selectedHawala.amount} {selectedHawala.currency}
                  </div>
                </div>
              </div>

              {/* Right Column: Verification */}
              <div className="verification-column">
                <h4>{t("linkCustomerProfile")}</h4>

                <div className="verification-search">
                  <input
                    type="text"
                    placeholder={t("searchPhoneOrId")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (searchQuery === "1401-233-4902") {
                        setFoundCustomer({
                          name: "Ahmad Khan",
                          father: "Mahmoud",
                          phone: "0799000111",
                          address: "Kabul City",
                        });
                        setIsNewCustomer(false);
                      } else {
                        setFoundCustomer(null);
                        setIsNewCustomer(true);
                      }
                    }}
                  >
                    {t("search")}
                  </button>
                </div>

                {foundCustomer && (
                  <div className="customer-found">
                    <h5>
                      <span>✅</span> {t("profileFound")}
                    </h5>
                    <div className="detail-row">
                      <span className="label">{t("fullName")}</span>
                      <span className="value">{foundCustomer.name}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">{t("father")}</span>
                      <span className="value">{foundCustomer.father}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">{t("phoneNumber")}</span>
                      <span className="value">{foundCustomer.phone}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">{t("homeAddress")}</span>
                      <span className="value">{foundCustomer.address}</span>
                    </div>
                  </div>
                )}

                {isNewCustomer && (
                  <div className="new-customer-form">
                    <div className="form-header">
                      <span className="icon">⚠️</span>
                      <h5>{t("profileNotFoundRegisterCustomer")}</h5>
                    </div>

                    <div className="upload-area">
                      <label>{t("uploadIdImageRequired")}</label>
                      <p>{t("uploadIdImageRequiredDescription")}</p>
                      <input type="file" accept="image/*" required />
                    </div>

                    <h5
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        paddingBottom: "0.5rem",
                        marginBottom: "1rem",
                        fontSize: "0.9rem",
                        color: "var(--text-main)",
                      }}
                    >
                      {t("confirmReceiverDetails")}
                    </h5>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>{t("fullName")}</label>
                        <input
                          type="text"
                          defaultValue={selectedHawala.receiverName}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t("fathersName")}</label>
                        <input
                          type="text"
                          defaultValue={selectedHawala.receiverFather}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t("idTazkira")}</label>
                        <input
                          type="text"
                          defaultValue={selectedHawala.receiverIdNum}
                        />
                      </div>
                      <div className="form-group">
                        <label>{t("mobileNumber")}</label>
                        <input
                          type="text"
                          placeholder={t("mobileNumberPlaceholder")}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>{t("homeAddress")}</label>
                        <input
                          type="text"
                          placeholder={t("provinceDistrictStreet")}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="action-btn secondary" onClick={closeModal}>
                {t("cancel")}
              </button>
              <button
                className="action-btn submit-btn"
                onClick={handlePayout}
                disabled={!foundCustomer && !isNewCustomer}
              >
                {isNewCustomer
                  ? t("registerCustomerAndPayOut")
                  : t("verifyAndPayOutCash")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Overlay */}
      {isImageZoomed && selectedHawala && (
        <div
          className="fullscreen-overlay"
          onClick={() => setIsImageZoomed(false)}
        >
          <img src={selectedHawala.idImageUrl} alt="Zoomed ID Document" />
          <button
            className="close-fullscreen"
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
