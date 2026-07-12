import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRole, ROLES } from "../utils/auth";
import { useLanguage } from "../context/LanguageContext";
import { usePopup } from "../context/PopupContext";
import API from "../utils/api";
import "./SendHawalaList.css";

export default function SendHawalaList() {
  const { t } = useLanguage();
  const { showAlert, showConfirm } = usePopup();
  const { id } = useParams();
  const navigate = useNavigate();

  const [sentHawalas, setSentHawalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const currentUserRole = getRole() || ROLES.EMPLOYEE;

  // New Hawala Form Fields
  const [destinationBranch, setDestinationBranch] = useState("Herat Main");
  const [senderName, setSenderName] = useState("");
  const [senderFather, setSenderFather] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderIdNum, setSenderIdNum] = useState("");
  
  const [receiverName, setReceiverName] = useState("");
  const [receiverFather, setReceiverFather] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverExpectedId, setReceiverExpectedId] = useState("");
  const [receiverIdImage, setReceiverIdImage] = useState(null);
  
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("AFN");
  const [fee, setFee] = useState("");
  const [fundingSource, setFundingSource] = useState("sarafi");
  const [selectedKahataId, setSelectedKahataId] = useState("");
  const [kahataAccounts, setKahataAccounts] = useState([]);

  // Fetch sent hawalas and Kahata accounts with localStorage caching
  useEffect(() => {
    const fetchSentData = async () => {
      const cacheKeyHawalas = `cache_sent_hawalas_${activeSearch}`;
      const cacheKeyKahata = `cache_kahata_list_dropdown`;
      const cachedHawalas = localStorage.getItem(cacheKeyHawalas);
      const cachedKahata = localStorage.getItem(cacheKeyKahata);
      
      if (cachedHawalas && cachedKahata) {
        setSentHawalas(JSON.parse(cachedHawalas));
        setKahataAccounts(JSON.parse(cachedKahata));
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const [hawalasRes, kahataRes] = await Promise.all([
          API.get(`/hawalas?type=sent&search=${activeSearch}`),
          API.get("/kahata")
        ]);
        setSentHawalas(hawalasRes.data);
        setKahataAccounts(kahataRes.data);
        
        localStorage.setItem(cacheKeyHawalas, JSON.stringify(hawalasRes.data));
        localStorage.setItem(cacheKeyKahata, JSON.stringify(kahataRes.data));
      } catch (err) {
        console.error("Error fetching sent page data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSentData();
  }, [activeSearch]);

  const selectedHawala = id ? sentHawalas.find((h) => h.id === id) : null;

  const isWithinEditWindow = (dateString) => {
    if (!dateString) return false;
    const standardizedDateStr = dateString.replace(/-/g, "/");
    const creationTime = new Date(standardizedDateStr).getTime();
    const currentTime = new Date().getTime();
    const diffInMinutes = (currentTime - creationTime) / (1000 * 60);
    return diffInMinutes >= 0 && diffInMinutes <= 15;
  };

  const handleRowClick = (hawala) => navigate(`/send-hawala/${hawala.id}`);
  
  const closeViewModal = () => {
    navigate("/send-hawala");
    setIsImageZoomed(false);
  };

  const closeSendModal = () => {
    setIsSendModalOpen(false);
    // Reset form states
    setSenderName("");
    setSenderFather("");
    setSenderPhone("");
    setSenderIdNum("");
    setReceiverName("");
    setReceiverFather("");
    setReceiverPhone("");
    setReceiverExpectedId("");
    setReceiverIdImage(null);
    setAmount("");
    setFee("");
    setFundingSource("sarafi");
    setSelectedKahataId("");
  };

  const handleSendHawala = async (e) => {
    e.preventDefault();
    if (fundingSource === "kahata" && !selectedKahataId) {
      showAlert(t("selectKahataError"));
      return;
    }

    try {
      const formData = new FormData();
      formData.append("type", "sent");
      formData.append("date", new Date().toLocaleString());
      formData.append("destinationBranch", destinationBranch);
      formData.append("senderName", senderName);
      formData.append("senderFather", senderFather);
      formData.append("senderPhone", senderPhone);
      formData.append("senderIdNum", senderIdNum);
      formData.append("receiverName", receiverName);
      formData.append("receiverFather", receiverFather || "");
      formData.append("receiverPhone", receiverPhone);
      formData.append("receiverExpectedId", receiverExpectedId || "");
      formData.append("amount", amount);
      formData.append("currency", currency);
      formData.append("fee", fee || "0");
      formData.append("fundingSource", fundingSource);
      if (selectedKahataId) {
        formData.append("kahataAccountId", selectedKahataId);
      }
      if (receiverIdImage) {
        formData.append("receiverIdImage", receiverIdImage);
      }

      const res = await API.post("/hawalas", formData);
      setSentHawalas((prev) => [res.data, ...prev]);
      
      // If funded from Kahata ledger, post a transaction to that ledger as well
      if (fundingSource === "kahata") {
        await API.post(`/kahata/${selectedKahataId}/transaction`, {
          type: "Debit",
          amount: parseFloat(amount),
          description: `Debit settlement for Outgoing Hawala ${res.data.id}`,
          date: new Date().toISOString().split("T")[0]
        });
      }

      let sourceText =
        fundingSource === "sarafi"
          ? t("mainSafeLabel")
          : `${t("kahataLabel")} (${selectedKahataId})`;
          
      showAlert(`${t("recordedHawalaMessage")} ${sourceText}`);
      closeSendModal();
    } catch (err) {
      console.error("Error creating outgoing transaction:", err);
      showAlert("Error logging outgoing transaction: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteHawala = async (hawalaId) => {
    const isOverride =
      selectedHawala &&
      !isWithinEditWindow(selectedHawala.date) &&
      (currentUserRole === ROLES.MANAGER || currentUserRole === ROLES.OWNER);
      
    const confirmationMessage = isOverride
      ? `${t("managerOverride")} ${hawalaId}? ${t("outsideWindow")}`
      : `${t("deleteConfirmation")} ${hawalaId}?`;

    if (await showConfirm(confirmationMessage)) {
      try {
        await API.delete(`/hawalas/${hawalaId}`);
        setSentHawalas((prev) => prev.filter((h) => h.id !== hawalaId));
        closeViewModal();
      } catch (err) {
        console.error("Deletion error:", err);
        showAlert("Error deleting record: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchVal);
  };

  return (
    <div className="list-container">
      <div className="list-header send-hawala-header">
        <div className="header-actions-group send-hawala-actions">
          <form className="search-bar" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder={t("searchNameOrId")}
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
            <button type="submit" className="search-btn">{t("search")}</button>
          </form>
          <button className="add-btn" onClick={() => setIsSendModalOpen(true)}>
            + Send Hawala
          </button>
        </div>
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
                <th>{t("toBranch")}</th>
                <th>{t("receiverName")}</th>
                <th>{t("amount")}</th>
                <th>{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {sentHawalas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No sent transactions logged.
                  </td>
                </tr>
              ) : (
                sentHawalas.map((hawala) => (
                  <tr
                    key={hawala.id}
                    onClick={() => handleRowClick(hawala)}
                    className="clickable-row"
                  >
                    <td className="fw-bold">{hawala.id}</td>
                    <td>{hawala.date.split(" ")[0]}</td>
                    <td>{hawala.destinationBranch}</td>
                    <td className="fw-bold">{hawala.receiverName}</td>
                    <td className="amount-col">
                      {hawala.amount.toLocaleString()} {hawala.currency}
                    </td>
                    <td>
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

      {/* --- DETAIL VIEW MODAL --- */}
      {selectedHawala && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {t("hawalaDetails")}: {selectedHawala.id}
              </h3>
              <button className="close-btn" onClick={closeViewModal}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="details-grid-2">
                <div className="detail-card">
                  <h4>{t("senderInformation")}</h4>
                  <div className="detail-row">
                    <span className="label">{t("fullName")}</span>
                    <span className="value">{selectedHawala.senderName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">{t("fathersName")}</span>
                    <span className="value">{selectedHawala.senderFather}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">{t("phoneNumber")}</span>
                    <span className="value">{selectedHawala.senderPhone}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Sender Branch</span>
                    <span className="value">{selectedHawala.senderBranch || "—"}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <h4>Receiver Details</h4>
                  <div className="detail-row">
                    <span className="label">{t("fullName")}</span>
                    <span className="value">{selectedHawala.receiverName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">{t("phoneNumber")}</span>
                    <span className="value">{selectedHawala.receiverPhone}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Expected ID Number</span>
                    <span className="value">{selectedHawala.receiverExpectedId || "—"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Destination Branch</span>
                    <span className="value">{selectedHawala.destinationBranch || "—"}</span>
                  </div>
                  {selectedHawala.receiverIdImageUrl && (
                    <div style={{ marginTop: "1rem" }}>
                      <span className="label" style={{ display: "block", marginBottom: "0.5rem" }}>
                        Receiver ID Image
                      </span>
                      <img
                        src={selectedHawala.receiverIdImageUrl}
                        alt="Receiver ID Document"
                        style={{
                          maxWidth: "100%",
                          maxHeight: "180px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          border: "1px solid var(--border-color)",
                        }}
                        onClick={() => setIsImageZoomed(true)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="action-btn danger"
                onClick={() => handleDeleteHawala(selectedHawala.id)}
              >
                Delete Record
              </button>
              <button className="action-btn secondary" onClick={closeViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Image Modal */}
      {isImageZoomed && selectedHawala?.receiverIdImageUrl && (
        <div className="modal-overlay" onClick={() => setIsImageZoomed(false)} style={{ zIndex: 1000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "transparent", border: "none", boxShadow: "none", textAlign: "center" }}>
            <img
              src={selectedHawala.receiverIdImageUrl}
              alt="Zoomed Receiver ID"
              style={{ maxWidth: "90%", maxHeight: "85vh", borderRadius: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.8)" }}
            />
          </div>
        </div>
      )}

      {/* --- DRAFT SEND HAWALA FORM MODAL --- */}
      {isSendModalOpen && (
        <div className="modal-overlay" onClick={closeSendModal}>
          <div
            className="modal-content send-modal-form"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "800px" }}
          >
            <div className="modal-header">
              <h3>Draft Outgoing Hawala</h3>
              <button className="close-btn" onClick={closeSendModal}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSendHawala}>
              <div className="modal-body">
                <div className="form-grid-3">
                  <div className="form-group">
                    <label>Destination Branch</label>
                    <select
                      value={destinationBranch}
                      onChange={(e) => setDestinationBranch(e.target.value)}
                    >
                      <option value="Herat Main">Herat Main</option>
                      <option value="Mazar Branch">Mazar Branch</option>
                      <option value="Dubai Branch">Dubai Branch</option>
                      <option value="Kabul Branch">Kabul Branch</option>
                    </select>
                  </div>
                </div>

                <h5 className="form-subtitle">Sender Profile</h5>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Sender Full Name</label>
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Father Name</label>
                    <input
                      type="text"
                      required
                      value={senderFather}
                      onChange={(e) => setSenderFather(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tazkira / Passport Number</label>
                    <input
                      type="text"
                      required
                      value={senderIdNum}
                      onChange={(e) => setSenderIdNum(e.target.value)}
                    />
                  </div>
                </div>

                <h5 className="form-subtitle">Receiver expected Details</h5>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Receiver Full Name</label>
                    <input
                      type="text"
                      required
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Father Name</label>
                    <input
                      type="text"
                      value={receiverFather}
                      onChange={(e) => setReceiverFather(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Expected ID Number</label>
                    <input
                      type="text"
                      value={receiverExpectedId}
                      onChange={(e) => setReceiverExpectedId(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Receiver ID Photo (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReceiverIdImage(e.target.files[0])}
                    />
                  </div>
                </div>

                <h5 className="form-subtitle">Financial Transaction Settler</h5>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
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
                    <label>Commission Fee (Ujrat)</label>
                    <input
                      type="number"
                      required
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-2" style={{ marginTop: "1rem" }}>
                  <div className="form-group">
                    <label>Funding Source</label>
                    <select
                      value={fundingSource}
                      onChange={(e) => setFundingSource(e.target.value)}
                    >
                      <option value="sarafi">Physical Cash (Khazana)</option>
                      <option value="kahata">Kahata Ledger Account</option>
                    </select>
                  </div>

                  {fundingSource === "kahata" && (
                    <div className="form-group">
                      <label>Deduct from Ledger Account</label>
                      <select
                        value={selectedKahataId}
                        onChange={(e) => setSelectedKahataId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Account --</option>
                        {kahataAccounts
                          .filter((acc) => acc.currency === currency)
                          .map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} (Balance: {acc.netBalance})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="action-btn secondary"
                  onClick={closeSendModal}
                >
                  Cancel
                </button>
                <button type="submit" className="action-btn submit-btn">
                  Draft & Record Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
