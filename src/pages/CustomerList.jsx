import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { usePopup } from "../context/PopupContext";
import API, { resolveFileUrl } from "../utils/api";
import "./CustomerList.css";

export default function CustomerList() {
  const { t, formatDate } = useLanguage();
  const { showAlert, showToast } = usePopup();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // Form Fields State
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [idImage, setIdImage] = useState(null);

  // Fetch customers from backend with localStorage caching
  useEffect(() => {
    const fetchCustomers = async () => {
      const cacheKey = `cache_customers_${activeSearch}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setCustomers(JSON.parse(cached));
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const res = await API.get(`/customers?search=${activeSearch}`);
        setCustomers(res.data);
        localStorage.setItem(cacheKey, JSON.stringify(res.data));
      } catch (err) {
        console.error("Error fetching customers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [activeSearch]);

  const selectedCustomer = id ? customers.find((c) => c.id === id) : null;

  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    if (selectedCustomer) {
      const fetchCustomerTransactions = async () => {
        setLoadingTransactions(true);
        try {
          const res = await API.get("/hawalas");
          const matched = res.data.filter((h) => {
            const customerNameLower = selectedCustomer.name.trim().toLowerCase();
            
            const cleanPhone = (num) => num ? num.replace(/[\s\-\+\(\)]/g, "") : "";
            const custPhoneClean = cleanPhone(selectedCustomer.phone);
            const senderPhoneClean = cleanPhone(h.senderPhone);
            const receiverPhoneClean = cleanPhone(h.receiverPhone);

            const matchesSender = h.senderName.trim().toLowerCase().includes(customerNameLower) ||
              customerNameLower.includes(h.senderName.trim().toLowerCase()) ||
              (custPhoneClean && senderPhoneClean && (senderPhoneClean.includes(custPhoneClean) || custPhoneClean.includes(senderPhoneClean)));

            const matchesReceiver = h.receiverName.trim().toLowerCase().includes(customerNameLower) ||
              customerNameLower.includes(h.receiverName.trim().toLowerCase()) ||
              (custPhoneClean && receiverPhoneClean && (receiverPhoneClean.includes(custPhoneClean) || custPhoneClean.includes(receiverPhoneClean)));

            return matchesSender || matchesReceiver;
          });
          setCustomerTransactions(matched);
        } catch (err) {
          console.error("Error fetching transactions for customer:", err);
        } finally {
          setLoadingTransactions(false);
        }
      };
      fetchCustomerTransactions();
    } else {
      setCustomerTransactions([]);
    }
  }, [selectedCustomer]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchVal);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const tempId = `CUST-TEMP-${Date.now()}`;
    const tempCustomer = {
      id: tempId,
      name: name.trim(),
      fatherName: fatherName.trim(),
      idNumber: idNumber.trim(),
      phone: phone.trim(),
      address: address.trim(),
      idImageUrl: idImage ? URL.createObjectURL(idImage) : "https://placehold.co/600x400/e2e8f0/64748b?text=Default+ID+Scan",
      branch: "", 
      createdAt: new Date().toISOString(),
    };

    // 1. Instantly update list state and close the modal
    setCustomers((prev) => [tempCustomer, ...prev]);
    setIsAddModalOpen(false);

    // Save inputs for recovery
    const formVals = { name, fatherName, idNumber, phone, address, idImage };

    // Reset inputs immediately
    setName("");
    setFatherName("");
    setIdNumber("");
    setPhone("");
    setAddress("");
    setIdImage(null);

    // Show initial toast
    showToast("Registering customer...", { severity: "info", duration: 1500 });

    const formData = new FormData();
    formData.append("name", formVals.name);
    formData.append("fatherName", formVals.fatherName);
    formData.append("idNumber", formVals.idNumber);
    formData.append("phone", formVals.phone);
    formData.append("address", formVals.address);
    if (formVals.idImage) {
      formData.append("idImage", formVals.idImage);
    }

    try {
      const res = await API.post("/customers", formData);
      // Replace optimistic temp customer with actual saved customer from DB
      setCustomers((prev) => {
        const updated = prev.map((c) => (c.id === tempId ? res.data : c));
        // Update localStorage cache as well
        const cacheKey = `cache_customers_${activeSearch}`;
        localStorage.setItem(cacheKey, JSON.stringify(updated));
        return updated;
      });
      showToast(t("saveCustomerMessage"), { severity: "success" });
    } catch (err) {
      console.error("Error saving customer:", err);
      // Revert optimistic addition
      setCustomers((prev) => {
        const reverted = prev.filter((c) => c.id !== tempId);
        const cacheKey = `cache_customers_${activeSearch}`;
        localStorage.setItem(cacheKey, JSON.stringify(reverted));
        return reverted;
      });
      // Restore form inputs and reopen modal so user can retry or adjust
      setName(formVals.name);
      setFatherName(formVals.fatherName);
      setIdNumber(formVals.idNumber);
      setPhone(formVals.phone);
      setAddress(formVals.address);
      setIdImage(formVals.idImage);
      setIsAddModalOpen(true);
      showAlert("Error registering customer: " + (err.response?.data?.message || err.message));
    }
  };

  const closeProfileModal = () => {
    navigate("/customers");
    setIsImageZoomed(false);
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <div className="header-actions">
          <form className="search-bar" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder={t("searchNamePhoneOrId")}
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
            <button type="submit" className="search-btn">{t("search")}</button>
          </form>
          <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>
            {t("addNewCustomer")}
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="empty-state" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div className="loader"></div>
          </div>
        ) : (
          <table className="customer-data-table">
            <thead>
              <tr>
                <th>{t("customerId")}</th>
                <th>{t("fullName")}</th>
                <th>{t("fathersName")}</th>
                <th>{t("phoneNumber")}</th>
                <th>{t("idTazkira")}</th>
                <th>{t("registered")}</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <td className="text-light">{customer.id}</td>
                    <td className="fw-bold">{customer.name}</td>
                    <td>{customer.fatherName}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.idNumber}</td>
                    <td>{customer.registeredDate}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODAL 1: View Customer --- */}
      {selectedCustomer && (
        <div className="modal-overlay" onClick={closeProfileModal}>
          <div
            className="modal-content customer-view-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "850px" }}
          >
            <div className="modal-header">
              <h3>{t("customerProfile")}</h3>
              <button className="close-btn" onClick={closeProfileModal}>
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", gap: "1.5rem", width: "100%", flexWrap: "wrap" }}>
                {/* Left: Details */}
                <div className="customer-details" style={{ flex: 1, minWidth: "280px" }}>
                  <div>
                    <div className="customer-name">{selectedCustomer.name}</div>
                    <span className="verified-badge">Verified Customer</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">{t("customerId")}</span>
                    <span className="detail-value">{selectedCustomer.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t("fathersName")}</span>
                    <span className="detail-value">{selectedCustomer.fatherName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t("phoneNumber")}</span>
                    <span className="detail-value">{selectedCustomer.phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t("idTazkira")}</span>
                    <span className="detail-value">{selectedCustomer.idNumber}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">{t("homeAddress")}</span>
                    <span className="detail-value">{selectedCustomer.address}</span>
                  </div>
                </div>

                {/* Right: ID Image */}
                <div className="id-section" style={{ flex: 1, minWidth: "280px" }}>
                  <div className="id-header">
                    <h4>{t("officialIdRecord")}</h4>
                    <button
                      className="enlarge-btn"
                      onClick={() => setIsImageZoomed(true)}
                    >
                      🔍 {t("enlarge")}
                    </button>
                  </div>
                  <div
                    className="id-image-wrapper"
                    onClick={() => setIsImageZoomed(true)}
                  >
                    <img src={resolveFileUrl(selectedCustomer.idImageUrl)} alt="Customer ID" />
                  </div>
                </div>
              </div>

              {/* Bottom: Transaction History */}
              <div className="customer-transactions" style={{ width: "100%", borderTop: "1px solid var(--border)", paddingTop: "1.2rem" }}>
                <h4 style={{ marginBottom: "1rem" }}>{t("transactionHistory")}</h4>
                {loadingTransactions ? (
                  <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-light)" }}>Loading transactions...</div>
                ) : customerTransactions.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--text-light)", padding: "1rem" }}>
                    No transactions found for this customer.
                  </div>
                ) : (
                  <div className="customer-tx-container">
                    <table className="customer-tx-table" style={{ fontSize: "0.85rem", width: "100%", margin: 0 }}>
                      <thead>
                        <tr>
                          <th>{t("date")}</th>
                           <th>{t("type")}</th>
                          <th>{t("sentFromTo")}</th>
                          <th>{t("amount")}</th>
                          <th>{t("status")}</th>
                        </tr>
                      </thead>
                      <tbody style={{ background: "transparent" }}>
                        {customerTransactions.map((tx) => {
                          const isSender = tx.senderName.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase() ||
                            (selectedCustomer.phone && tx.senderPhone && tx.senderPhone.trim() === selectedCustomer.phone.trim());
                          return (
                            <tr key={tx.id || tx._id} className="responsive-table-row">
                              <td className="cell-date">{formatDate(tx.date)}</td>
                              <td className="cell-type">
                                <span className={`badge ${isSender ? "badge-sent" : "badge-received"}`} style={{
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "0.75rem",
                                  background: isSender ? "rgba(59, 130, 246, 0.1)" : "rgba(16, 185, 129, 0.1)",
                                  color: isSender ? "var(--primary)" : "var(--success)"
                                }}>
                                  {isSender ? "Sent" : "Received"}
                                </span>
                              </td>
                              <td className="cell-details">
                                {isSender ? (
                                  <><strong>To:</strong> {tx.receiverName} ({tx.destinationBranch})</>
                                ) : (
                                  <><strong>From:</strong> {tx.senderName} ({tx.senderBranch})</>
                                )}
                              </td>
                              <td className="cell-amount" style={{ fontWeight: "bold" }}>
                                {tx.amount.toLocaleString()} {tx.currency}
                              </td>
                              <td className="cell-status">
                                <span style={{
                                  fontSize: "0.75rem",
                                  color: tx.status === "Paid Out" ? "var(--success)" : "var(--warning)"
                                }}>
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="action-btn" onClick={() => navigate("/send-hawala")}>
                {t("draftNewHawala")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Add Customer --- */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="modal-content add-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "700px" }}
          >
            <div className="modal-header">
              <h3>{t("registerNewCustomer")}</h3>
              <button
                className="close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form className="new-user-form" onSubmit={handleAddCustomer}>
              <div className="modal-body">
                <div className="upload-area">
                  <label>📸 {t("uploadIdImageRequired")}</label>
                  <p>{t("uploadIdImageDescription")}</p>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => setIdImage(e.target.files[0])}
                  />
                </div>

                <div className="form-section-title">{t("personalDetails")}</div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>{t("fullName")}</label>
                    <input
                      type="text"
                      required
                      placeholder={t("fullNamePlaceholder")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("fathersName")}</label>
                    <input
                      type="text"
                      required
                      placeholder={t("fathersNamePlaceholder")}
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("idTazkira")}</label>
                    <input
                      type="text"
                      required
                      placeholder={t("idTazkiraPlaceholder")}
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("phoneNumber")}</label>
                    <input
                      type="tel"
                      required
                      placeholder={t("phoneNumberPlaceholder")}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>{t("homeAddress")}</label>
                    <input
                      type="text"
                      required
                      placeholder={t("homeAddressPlaceholder")}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="action-btn secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  {t("cancel")}
                </button>
                <button type="submit" className="action-btn submit-btn">
                  {t("saveProfileAndId")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Fullscreen Image Zoom --- */}
      {isImageZoomed && selectedCustomer && (
        <div
          className="fullscreen-overlay"
          onClick={() => setIsImageZoomed(false)}
        >
          <img src={resolveFileUrl(selectedCustomer.idImageUrl)} alt="Zoomed ID Document" />
          <button
            className="fullscreen-close"
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
