import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import API from "../utils/api";
import "./CustomerList.css";

export default function CustomerList() {
  const { t } = useLanguage();
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

  // Fetch customers from backend
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/customers?search=${activeSearch}`);
        setCustomers(res.data);
      } catch (err) {
        console.error("Error fetching customers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [activeSearch]);

  const selectedCustomer = id ? customers.find((c) => c.id === id) : null;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchVal);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("name", name);
    formData.append("fatherName", fatherName);
    formData.append("idNumber", idNumber);
    formData.append("phone", phone);
    formData.append("address", address);
    if (idImage) {
      formData.append("idImage", idImage);
    }

    try {
      const res = await API.post("/customers", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCustomers((prev) => [res.data, ...prev]);
      alert(t("saveCustomerMessage"));
      setIsAddModalOpen(false);
      // Reset form
      setName("");
      setFatherName("");
      setIdNumber("");
      setPhone("");
      setAddress("");
      setIdImage(null);
    } catch (err) {
      console.error("Error saving customer:", err);
      alert("Error registering customer: " + (err.response?.data?.message || err.message));
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
          <div className="empty-state">Loading customer records...</div>
        ) : (
          <table className="data-table">
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
            className="modal-content view-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "850px" }}
          >
            <div className="modal-header">
              <h3>{t("customerProfile")}</h3>
              <button className="close-btn" onClick={closeProfileModal}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              {/* Left: Details */}
              <div className="customer-details">
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
              <div className="id-section">
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
                  <img src={selectedCustomer.idImageUrl} alt="Customer ID" />
                </div>
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

            <form onSubmit={handleAddCustomer}>
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
          <img src={selectedCustomer.idImageUrl} alt="Zoomed ID Document" />
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
