import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import API from "../utils/api";
import "./ReceivedHawalaList.css";

export default function ReceivedHawalaList() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();

  const [hawalas, setHawalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Fetch received hawalas from backend
  useEffect(() => {
    const fetchHawalas = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/hawalas?type=received&search=${activeSearch}`);
        setHawalas(res.data);
      } catch (err) {
        console.error("Error fetching received hawalas:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHawalas();
  }, [activeSearch]);

  const selectedHawala = id ? hawalas.find((h) => h.id === id) : null;

  const handleRowClick = (hawala) => {
    navigate(`/receive-hawala/${hawala.id}`);
  };

  const closeModal = () => {
    navigate("/receive-hawala");
    setSearchQuery("");
    setFoundCustomer(null);
    setIsNewCustomer(false);
    setIsImageZoomed(false);
  };

  const handlePayout = async () => {
    try {
      const res = await API.put(`/hawalas/${selectedHawala.id}/payout`);
      setHawalas((prev) =>
        prev.map((h) => (h.id === selectedHawala.id ? res.data : h))
      );
      alert(
        `Hawala ${selectedHawala.id} paid out successfully!`
      );
      closeModal();
    } catch (err) {
      console.error("Payout error:", err);
      alert("Error processing payout: " + (err.response?.data?.message || err.message));
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchVal);
  };

  // Handles client-side Tazkira search
  const handleVerifyCustomer = async () => {
    try {
      const res = await API.get(`/customers?search=${searchQuery}`);
      if (res.data && res.data.length > 0) {
        // Grab first match
        const c = res.data[0];
        setFoundCustomer({
          name: c.name,
          father: c.fatherName,
          phone: c.phone,
          address: c.address,
        });
        setIsNewCustomer(false);
      } else {
        setFoundCustomer(null);
        setIsNewCustomer(true);
      }
    } catch (err) {
      console.error("Verification error:", err);
      // Fallback in case of network issue
      setIsNewCustomer(true);
    }
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <form className="search-bar" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder={t("searchByNameOrId")}
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
          <button type="submit" className="search-btn">{t("search")}</button>
        </form>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="empty-state">Loading transactions queue...</div>
        ) : (
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
              {hawalas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No received transactions found.
                  </td>
                </tr>
              ) : (
                hawalas.map((hawala) => (
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
                      {hawala.amount.toLocaleString()} {hawala.currency}
                    </td>
                    <td data-label={t("status")}>
                      <span
                        className={`status-badge ${
                          hawala.status === "Paid Out" ? "paid" : "pending"
                        }`}
                      >
                        {hawala.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
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
                    <span className="value">{selectedHawala.senderPhone || "—"}</span>
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
                      {selectedHawala.receiverFather || "—"}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">{t("idTazkira")}</span>
                    <span className="value">
                      {selectedHawala.receiverIdNum || "—"}
                    </span>
                  </div>
                </div>

                {/* ID Image */}
                {(selectedHawala.receiverIdImageUrl || selectedHawala.idImageUrl) && (
                  <div className="detail-card">
                    <h4>{t("idDocument")}</h4>
                    <div
                      className="id-image-wrapper"
                      onClick={() => setIsImageZoomed(true)}
                    >
                      <img
                        src={selectedHawala.receiverIdImageUrl || selectedHawala.idImageUrl}
                        alt="Receiver ID Document"
                      />
                    </div>
                    <div className="image-hint">{t("clickImageToEnlarge")}</div>
                  </div>
                )}

                {/* Payout Amount */}
                <div className="detail-card payout-amount">
                  <h4>{t("payoutAmount")}</h4>
                  <div className="massive-amount">
                    {selectedHawala.amount.toLocaleString()} {selectedHawala.currency}
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
                  <button onClick={handleVerifyCustomer}>{t("search")}</button>
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

                    <div className="form-grid">
                      <div className="form-group">
                        <label>{t("fullName")}</label>
                        <input
                          type="text"
                          defaultValue={selectedHawala.receiverName}
                          readOnly
                        />
                      </div>
                      <div className="form-group">
                        <label>{t("fathersName")}</label>
                        <input
                          type="text"
                          defaultValue={selectedHawala.receiverFather}
                          readOnly
                        />
                      </div>
                      <div className="form-group">
                        <label>{t("idTazkira")}</label>
                        <input
                          type="text"
                          defaultValue={selectedHawala.receiverIdNum}
                          readOnly
                        />
                      </div>
                    </div>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-light)", marginTop: "0.5rem" }}>
                      Please go to the <strong>Customers</strong> tab to register this client first, then proceed with the payout.
                    </p>
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
                disabled={selectedHawala.status === "Paid Out" || (!foundCustomer && !isNewCustomer)}
              >
                {selectedHawala.status === "Paid Out"
                  ? "Already Paid Out"
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
          <img src={selectedHawala.receiverIdImageUrl || selectedHawala.idImageUrl} alt="Zoomed ID Document" />
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
