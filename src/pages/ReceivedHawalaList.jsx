import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { usePopup } from "../context/PopupContext";
import API, { resolveFileUrl } from "../utils/api";
import "./ReceivedHawalaList.css";

export default function ReceivedHawalaList() {
  const { t } = useLanguage();
  const { showAlert, showToast } = usePopup();
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

  // Fetch received hawalas from backend with localStorage caching
  useEffect(() => {
    const fetchHawalas = async () => {
      const cacheKey = `cache_received_hawalas_${activeSearch}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setHawalas(JSON.parse(cached));
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const res = await API.get(`/hawalas?type=received&search=${activeSearch}`);
        setHawalas(res.data);
        localStorage.setItem(cacheKey, JSON.stringify(res.data));
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
    if (!selectedHawala) return;

    const originalHawala = { ...selectedHawala };
    const tempPaidHawala = {
      ...selectedHawala,
      status: "Paid Out",
    };

    // 1. Instantly update state and close modal
    setHawalas((prev) =>
      prev.map((h) => (h.id === selectedHawala.id ? tempPaidHawala : h))
    );
    closeModal();

    showToast(`Processing payout for Hawala ${selectedHawala.id}...`, { severity: "info", duration: 1500 });

    try {
      const res = await API.put(`/hawalas/${selectedHawala.id}/payout`);
      // Update state with actual response
      setHawalas((prev) => {
        const updated = prev.map((h) => (h.id === selectedHawala.id ? res.data : h));
        const cacheKey = `cache_hawalas_received_${activeSearch}`;
        localStorage.setItem(cacheKey, JSON.stringify(updated));
        return updated;
      });
      showToast(
        `Hawala ${selectedHawala.id} paid out successfully!`,
        { severity: "success" }
      );
    } catch (err) {
      console.error("Payout error:", err);
      // Revert state
      setHawalas((prev) => {
        const reverted = prev.map((h) => (h.id === selectedHawala.id ? originalHawala : h));
        const cacheKey = `cache_hawalas_received_${activeSearch}`;
        localStorage.setItem(cacheKey, JSON.stringify(reverted));
        return reverted;
      });
      // Reopen modal for retry
      navigate(`/receive-hawala/${selectedHawala.id}`);
      showAlert("Error processing payout: " + (err.response?.data?.message || err.message));
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
          <div className="empty-state" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div className="loader"></div>
          </div>
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
                        src={resolveFileUrl(selectedHawala.receiverIdImageUrl || selectedHawala.idImageUrl)}
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
          <img src={resolveFileUrl(selectedHawala.receiverIdImageUrl || selectedHawala.idImageUrl)} alt="Zoomed ID Document" />
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
