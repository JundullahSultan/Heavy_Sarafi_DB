import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRole, ROLES } from "../utils/auth";
import { useLanguage } from "../context/LanguageContext";
import { usePopup } from "../context/PopupContext";
import API from "../utils/api";
import CustomDropdown from "../components/CustomDropdown";
import "./SendHawalaList.css";

const BRANCHES = ["Herat Main", "Mazar Branch", "Dubai Branch", "Kabul Branch"];

export default function SendHawalaList() {
  const { t, formatDate } = useLanguage();
  const { showAlert, showConfirm, showToast } = usePopup();
  const { id } = useParams();
  const navigate = useNavigate();

  const [sentHawalas, setSentHawalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const currentUserRole = getRole() || ROLES.EMPLOYEE;

  // Kabul-only: external hawala registration
  const userBranchStored = localStorage.getItem("userBranch") || "Kabul Branch";
  const isKabulBranch = userBranchStored === "Kabul Branch";

  // New Hawala Form Fields
  const [fromBranch, setFromBranch] = useState(userBranchStored);
  const [customFromBranch, setCustomFromBranch] = useState("");
  const isExternalHawala = isKabulBranch && fromBranch !== "Kabul Branch";

  const [destinationBranch, setDestinationBranch] = useState(() => {
    const userBranch = localStorage.getItem("userBranch") || "Kabul Branch";
    const available = BRANCHES.filter(b => b !== userBranch);
    return available[0] || "Herat Main";
  });
  const [senderName, setSenderName] = useState("");
  const [senderFather, setSenderFather] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderIdNum, setSenderIdNum] = useState("");

  const [senderSearchQuery, setSenderSearchQuery] = useState("");
  const [senderSearchResults, setSenderSearchResults] = useState([]);
  const [selectedSenderProfile, setSelectedSenderProfile] = useState(null);
  const [recentCustomers, setRecentCustomers] = useState([]);

  useEffect(() => {
    if (isSendModalOpen) {
      const fetchRecent = async () => {
        try {
          const res = await API.get("/customers");
          setRecentCustomers(res.data.slice(0, 5));
        } catch (err) {
          console.error("Error fetching recent customers:", err);
        }
      };
      fetchRecent();
    } else {
      setRecentCustomers([]);
      setSelectedSenderProfile(null);
      setSenderSearchQuery("");
      setSenderSearchResults([]);
    }
  }, [isSendModalOpen]);

  const handleSearchSender = async () => {
    if (!senderSearchQuery.trim()) return;
    try {
      const res = await API.get(`/customers?search=${senderSearchQuery}&searchField=name`);
      setSenderSearchResults(res.data);
    } catch (err) {
      console.error("Error searching sender:", err);
    }
  };

  const handleSelectSender = (c) => {
    setSelectedSenderProfile(c);
    setSenderName(c.name);
    setSenderFather(c.fatherName);
    setSenderPhone(c.phone);
    setSenderIdNum(c.idNumber);
    setSenderSearchQuery("");
    setSenderSearchResults([]);
  };
  
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

  const purgeLegacyCacheKeys = (prefix, branch) => {
    const branchPrefix = `${prefix}_${branch}_`;
    const legacyPrefix = `${prefix}_`;
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(legacyPrefix) && !key.startsWith(branchPrefix)) {
        localStorage.removeItem(key);
      }
    }
  };

  // Fetch sent hawalas and Kahata accounts with localStorage caching
  useEffect(() => {
    const fetchSentData = async () => {
      const userBranch = localStorage.getItem("userBranch") || "unknown";
      purgeLegacyCacheKeys("cache_sent_hawalas", userBranch);
      purgeLegacyCacheKeys("cache_kahata_list_dropdown", userBranch);
      const cacheKeyHawalas = `cache_sent_hawalas_${userBranch}_${activeSearch}`;
      const cacheKeyKahata = `cache_kahata_list_dropdown_${userBranch}`;
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
    setFromBranch(userBranchStored);
    setCustomFromBranch("");
    const userBranch = localStorage.getItem("userBranch") || "Kabul Branch";
    const available = BRANCHES.filter(b => b !== userBranch);
    setDestinationBranch(available[0] || "Herat Main");
    setSelectedSenderProfile(null);
    setSenderSearchQuery("");
    setSenderSearchResults([]);
  };

  const handleSendHawala = async (e) => {
    e.preventDefault();
    const userBranch = localStorage.getItem("userBranch") || "Kabul Branch";

    // Determine the actual sender branch and destination for this hawala
    const actualFromBranch = isExternalHawala
      ? (fromBranch === "__custom__" ? customFromBranch.trim() : fromBranch)
      : userBranch;
    const actualDestination = isExternalHawala ? "Kabul Branch" : destinationBranch;

    // Validate: custom branch name must not be empty
    if (isExternalHawala && fromBranch === "__custom__" && !customFromBranch.trim()) {
      showAlert("Please enter a branch name.");
      return;
    }

    // Only check same-branch for non-external hawalas
    if (!isExternalHawala && actualDestination === userBranch) {
      showAlert(t("sameBranchError"));
      return;
    }
    if (!isExternalHawala && fundingSource === "kahata" && !selectedKahataId) {
      showAlert(t("selectKahataError"));
      return;
    }

    const tempId = `SHW-TEMP-${Date.now()}`;
    const tempHawala = {
      id: tempId,
      type: "sent",
      date: new Date().toISOString().split("T")[0],
      senderBranch: actualFromBranch,
      destinationBranch: actualDestination,
      senderName,
      senderFather,
      senderPhone,
      senderIdNum,
      receiverName,
      receiverFather: receiverFather || "",
      receiverPhone,
      receiverExpectedId: receiverExpectedId || "",
      receiverIdImageUrl: receiverIdImage ? URL.createObjectURL(receiverIdImage) : "",
      amount: parseFloat(amount),
      currency,
      fee: parseFloat(fee) || 0,
      fundingSource: isExternalHawala ? "sarafi" : fundingSource,
      kahataAccountId: isExternalHawala ? undefined : (selectedKahataId || undefined),
      skipVaultCredit: isExternalHawala,
      status: "Sent - Pending Payout",
      createdAt: new Date().toISOString(),
    };

    // 1. Instantly update list state and close the modal
    setSentHawalas((prev) => [tempHawala, ...prev]);
    closeSendModal();

    // Save inputs for recovery
    const savedInputs = {
      fromBranch,
      customFromBranch,
      destinationBranch: actualDestination,
      actualFromBranch,
      isExternalHawala,
      senderName,
      senderFather,
      senderPhone,
      senderIdNum,
      receiverName,
      receiverFather,
      receiverPhone,
      receiverExpectedId,
      amount,
      currency,
      fee,
      fundingSource: isExternalHawala ? "sarafi" : fundingSource,
      selectedKahataId: isExternalHawala ? "" : selectedKahataId,
      receiverIdImage
    };

    showToast("Processing outgoing Hawala...", { severity: "info", duration: 1500 });

    try {
      const formData = new FormData();
      formData.append("type", "sent");
      formData.append("date", tempHawala.date);
      formData.append("destinationBranch", savedInputs.destinationBranch);
      formData.append("senderBranch", savedInputs.actualFromBranch);
      formData.append("senderName", savedInputs.senderName);
      formData.append("senderFather", savedInputs.senderFather);
      formData.append("senderPhone", savedInputs.senderPhone);
      formData.append("senderIdNum", savedInputs.senderIdNum);
      formData.append("receiverName", savedInputs.receiverName);
      formData.append("receiverFather", savedInputs.receiverFather || "");
      formData.append("receiverPhone", savedInputs.receiverPhone);
      formData.append("receiverExpectedId", savedInputs.receiverExpectedId || "");
      formData.append("amount", savedInputs.amount);
      formData.append("currency", savedInputs.currency);
      formData.append("fee", savedInputs.fee || "0");
      formData.append("fundingSource", savedInputs.fundingSource);
      if (savedInputs.isExternalHawala) {
        formData.append("skipVaultCredit", "true");
      }
      if (savedInputs.selectedKahataId) {
        formData.append("kahataAccountId", savedInputs.selectedKahataId);
      }
      if (savedInputs.receiverIdImage) {
        formData.append("receiverIdImage", savedInputs.receiverIdImage);
      }

      const res = await API.post("/hawalas", formData);
      
      // Update state with actual response
      setSentHawalas((prev) => {
        const updated = prev.map((h) => (h.id === tempId ? res.data : h));
        const userBranch = localStorage.getItem("userBranch") || "unknown";
        const cacheKey = `cache_sent_hawalas_${userBranch}_${activeSearch}`;
        localStorage.setItem(cacheKey, JSON.stringify(updated));
        return updated;
      });
      
      // If funded from Kahata ledger, post a transaction to that ledger as well
      if (savedInputs.fundingSource === "kahata") {
        try {
          await API.post(`/kahata/${savedInputs.selectedKahataId}/transaction`, {
            type: "Debit",
            amount: parseFloat(savedInputs.amount),
            description: `Debit settlement for Outgoing Hawala ${res.data.id}`,
            date: new Date().toISOString().split("T")[0]
          });
          // Invalidate Kahata cache so it pulls fresh on next visit
          const userBranch = localStorage.getItem("userBranch") || "unknown";
          localStorage.removeItem(`cache_kahata_list_dropdown_${userBranch}`);
        } catch (err) {
          console.error("Ledger transaction background logging failed:", err);
        }
      }

      let sourceText =
        savedInputs.fundingSource === "sarafi"
          ? t("mainSafeLabel")
          : `${t("kahataLabel")} (${savedInputs.selectedKahataId})`;
          
      showToast(`${t("recordedHawalaMessage")} ${sourceText}`, { severity: "success" });
    } catch (err) {
      console.error("Error creating outgoing transaction:", err);
      // Revert state
      setSentHawalas((prev) => {
        const reverted = prev.filter((h) => h.id !== tempId);
        const userBranch = localStorage.getItem("userBranch") || "unknown";
        const cacheKey = `cache_sent_hawalas_${userBranch}_${activeSearch}`;
        localStorage.setItem(cacheKey, JSON.stringify(reverted));
        return reverted;
      });
      // Re-populate modal inputs and re-open modal
      setFromBranch(savedInputs.fromBranch);
      setCustomFromBranch(savedInputs.customFromBranch);
      setDestinationBranch(savedInputs.destinationBranch);
      setSenderName(savedInputs.senderName);
      setSenderFather(savedInputs.senderFather);
      setSenderPhone(savedInputs.senderPhone);
      setSenderIdNum(savedInputs.senderIdNum);
      setReceiverName(savedInputs.receiverName);
      setReceiverFather(savedInputs.receiverFather);
      setReceiverPhone(savedInputs.receiverPhone);
      setReceiverExpectedId(savedInputs.receiverExpectedId);
      setAmount(savedInputs.amount);
      setCurrency(savedInputs.currency);
      setFee(savedInputs.fee);
      setFundingSource(savedInputs.fundingSource);
      setSelectedKahataId(savedInputs.selectedKahataId);
      setReceiverIdImage(savedInputs.receiverIdImage);
      setIsSendModalOpen(true);
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
            {t("draftNewHawalaButton")}
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
                    <td>{formatDate(hawala.date.split(" ")[0])}</td>
                    <td>{hawala.destinationBranch}</td>
                    <td className="fw-bold">{hawala.receiverName}</td>
                    <td className="amount-col">
                      {hawala.amount.toLocaleString()} {t("currency_" + hawala.currency)}
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
                {/* Branch Selection */}
                {isKabulBranch ? (
                  /* Kabul branch: From/To branch selectors */
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>{t("fromBranch") || "From Branch"}</label>
                      <CustomDropdown
                        options={[
                          ...BRANCHES.map(b => ({ value: b, label: b })),
                          { value: "__custom__", label: "✏️ " + (t("enterCustomBranch") || "Enter custom branch...") }
                        ]}
                        value={fromBranch}
                        onChange={(val) => {
                          setFromBranch(val);
                          if (val !== "__custom__") setCustomFromBranch("");
                        }}
                        variant="6"
                      />
                      {fromBranch === "__custom__" && (
                        <input
                          type="text"
                          placeholder={t("customBranchName") || "Branch name..."}
                          value={customFromBranch}
                          onChange={(e) => setCustomFromBranch(e.target.value)}
                          style={{ marginTop: "0.5rem" }}
                          required
                        />
                      )}
                    </div>
                    <div className="form-group">
                      <label>{t("toBranch") || "To Branch"}</label>
                      {isExternalHawala || fromBranch === "__custom__" ? (
                        <div style={{
                          padding: "0.6rem 1rem",
                          background: "rgba(16, 185, 129, 0.08)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          borderRadius: "8px",
                          color: "var(--success)",
                          fontWeight: 600,
                          fontSize: "0.85rem"
                        }}>
                          📍 Kabul Branch
                        </div>
                      ) : (
                        <CustomDropdown
                          options={BRANCHES.filter(b => b !== "Kabul Branch").map(b => ({ value: b, label: b }))}
                          value={destinationBranch}
                          onChange={setDestinationBranch}
                          variant="6"
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  /* Non-Kabul branches: original destination-only selector */
                  <div className="form-grid-3">
                    <div className="form-group">
                      <label>Destination Branch</label>
                      <CustomDropdown
                        options={BRANCHES.filter(b => b !== userBranchStored).map(b => ({ value: b, label: b }))}
                        value={destinationBranch}
                        onChange={setDestinationBranch}
                        variant="6"
                      />
                    </div>
                  </div>
                )}

                <h5 className="form-subtitle">Sender Profile</h5>
                
                {!selectedSenderProfile ? (
                  <div className="sender-selection-panel" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed var(--border)", borderRadius: "10px", padding: "1rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                      <input
                        type="text"
                        placeholder={t("searchSenderByName")}
                        value={senderSearchQuery}
                        onChange={(e) => setSenderSearchQuery(e.target.value)}
                        style={{ flex: 1 }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSearchSender();
                          }
                        }}
                      />
                      <button type="button" className="action-btn" onClick={handleSearchSender} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
                        {t("search")}
                      </button>
                    </div>

                    {senderSearchResults.length > 0 ? (
                      <div className="search-results" style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "0.5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <h6 style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-light)" }}>{t("searchResults")}</h6>
                          <button type="button" onClick={() => setSenderSearchResults([])} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.75rem" }}>{t("clearResults")}</button>
                        </div>
                        <table className="recent-customers-table">
                          <thead>
                            <tr>
                              <th>{t("fullName")}</th>
                              <th>{t("fathersName")}</th>
                              <th>{t("phoneNumber")}</th>
                              <th>{t("action")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {senderSearchResults.map(c => (
                              <tr key={c.id || c._id} onClick={() => handleSelectSender(c)} className="responsive-table-row">
                                <td className="cell-name bold">{c.name}</td>
                                <td className="cell-father">{c.fatherName}</td>
                                <td className="cell-phone">{c.phone}</td>
                                <td className="cell-action link-action">{t("link")} &rarr;</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="recent-list">
                        <h6 style={{ margin: "0 0 0.5rem 0", fontSize: "0.8rem", color: "var(--text-light)" }}>{t("recentCustomersLink")}</h6>
                        {recentCustomers.length === 0 ? (
                          <div style={{ fontSize: "0.8rem", color: "var(--text-light)", padding: "0.5rem", textAlign: "center" }}>{t("noRecentCustomers")}</div>
                        ) : (
                          <table className="recent-customers-table">
                            <thead>
                              <tr>
                                <th>{t("fullName")}</th>
                                <th>{t("fathersName")}</th>
                                <th>{t("phoneNumber")}</th>
                                <th>{t("action")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recentCustomers.map(c => (
                                <tr key={c.id || c._id} onClick={() => handleSelectSender(c)} className="responsive-table-row">
                                  <td className="cell-name bold">{c.name}</td>
                                  <td className="cell-father">{c.fatherName}</td>
                                  <td className="cell-phone">{c.phone}</td>
                                  <td className="cell-action link-action">{t("link")} &rarr;</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(16, 185, 129, 0.05)", border: "1px solid var(--success)", borderRadius: "10px", padding: "0.75rem 1rem", marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.85rem" }}>
                      <strong>✅ {t("senderSelected")}</strong> {selectedSenderProfile.name} ({selectedSenderProfile.phone})
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        setSelectedSenderProfile(null);
                        setSenderName("");
                        setSenderFather("");
                        setSenderPhone("");
                        setSenderIdNum("");
                      }}
                      style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.8rem", padding: 0 }}
                    >
                      {t("change")}
                    </button>
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>{t("fullName")}</label>
                    <input
                      type="text"
                      required
                      value={senderName}
                      readOnly
                      placeholder={t("selectRegisteredCustomer")}
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("fathersName")}</label>
                    <input
                      type="text"
                      required
                      value={senderFather}
                      readOnly
                      placeholder={t("selectRegisteredCustomer")}
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("phoneNumber")}</label>
                    <input
                      type="tel"
                      required
                      value={senderPhone}
                      readOnly
                      placeholder={t("selectRegisteredCustomer")}
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("idTazkira")}</label>
                    <input
                      type="text"
                      required
                      value={senderIdNum}
                      readOnly
                      placeholder={t("selectRegisteredCustomer")}
                      style={{ background: "rgba(255,255,255,0.03)" }}
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
                    <CustomDropdown
                      options={["AFN", "USD", "PKR", "EUR", "CNY", "IRR", "GBP"].map(c => ({ value: c, label: t("currency_" + c) }))}
                      value={currency}
                      onChange={setCurrency}
                      variant="6"
                    />
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

                {/* Funding Source — hidden for external hawalas (no vault/kahata needed on creation) */}
                {!isExternalHawala && (
                  <div className="form-grid-2" style={{ marginTop: "1rem" }}>
                    <div className="form-group">
                      <label>Funding Source</label>
                      <CustomDropdown
                        options={[
                          { value: "sarafi", label: "Physical Cash (Khazana)" },
                          { value: "kahata", label: "Kahata Ledger Account" }
                        ]}
                        value={fundingSource}
                        onChange={setFundingSource}
                        variant="6"
                      />
                    </div>

                    {fundingSource === "kahata" && (
                      <div className="form-group">
                        <label>Deduct from Ledger Account</label>
                        <CustomDropdown
                          options={[
                            { value: "", label: "-- Choose Account --" },
                            ...kahataAccounts
                              .filter((acc) => acc.currency === currency)
                              .map((acc) => ({ value: acc.id, label: `${acc.name} (Balance: ${acc.netBalance})` }))
                          ]}
                          value={selectedKahataId}
                          onChange={setSelectedKahataId}
                          variant="6"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="action-btn secondary"
                  onClick={closeSendModal}
                >
                  {t("cancel")}
                </button>
                <button type="submit" className="action-btn submit-btn">
                  {t("sendHawalaOfficially")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
