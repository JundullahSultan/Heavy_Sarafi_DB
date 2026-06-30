import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import "./CustomerList.css";

export default function CustomerList() {
  const { t } = useLanguage();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const [customers] = useState([
    {
      id: "CUST-1001",
      name: "Ahmad Khan",
      fatherName: "Mahmoud",
      phone: "0799000111",
      idNumber: "1401-233-4902",
      address: "Kabul City, District 4",
      registeredDate: "2026-01-15",
      idImageUrl:
        "https://placehold.co/600x400/e2e8f0/64748b?text=Customer+Tazkira+Image",
    },
    {
      id: "CUST-1002",
      name: "Zalmay",
      fatherName: "Tariq",
      phone: "0700987654",
      idNumber: "P-9921834",
      address: "Mazar-e-Sharif",
      registeredDate: "2026-03-22",
      idImageUrl:
        "https://placehold.co/600x400/e2e8f0/64748b?text=Customer+Passport+Image",
    },
  ]);

  const handleAddCustomer = (e) => {
    e.preventDefault();
    alert(t("saveCustomerMessage"));
    setIsAddModalOpen(false);
  };

  const closeProfileModal = () => {
    setSelectedCustomer(null);
    setIsImageZoomed(false);
  };

  return (
    <div className="list-container">
      <div className="list-header">
        <h2 className="section-title">{t("customerDirectory")}</h2>
        <div className="header-actions">
          <div className="search-bar">
            <input type="text" placeholder={t("searchNamePhoneOrId")} />
            <button className="search-btn">{t("search")}</button>
          </div>
          <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>
            {t("addNewCustomer")}
          </button>
        </div>
      </div>

      <div className="table-wrapper">
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
            {customers.map((customer) => (
              <tr
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
              >
                <td className="text-light">{customer.id}</td>
                <td className="fw-bold">{customer.name}</td>
                <td>{customer.fatherName}</td>
                <td>{customer.phone}</td>
                <td>{customer.idNumber}</td>
                <td>{customer.registeredDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
                  <span className="verified-badge">
                    {t("verifiedCustomer")}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">{t("customerId")}</span>
                  <span className="detail-value">{selectedCustomer.id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t("fathersName")}</span>
                  <span className="detail-value">
                    {selectedCustomer.fatherName}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t("phoneNumber")}</span>
                  <span className="detail-value">{selectedCustomer.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t("idTazkira")}</span>
                  <span className="detail-value">
                    {selectedCustomer.idNumber}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">{t("homeAddress")}</span>
                  <span className="detail-value">
                    {selectedCustomer.address}
                  </span>
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
              <button className="action-btn">{t("draftNewHawala")}</button>
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
                  <input type="file" accept="image/*" required />
                </div>

                <div className="form-section-title">{t("personalDetails")}</div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>{t("fullName")}</label>
                    <input
                      type="text"
                      required
                      placeholder={t("fullNamePlaceholder")}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("fathersName")}</label>
                    <input
                      type="text"
                      required
                      placeholder={t("fathersNamePlaceholder")}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("idTazkira")}</label>
                    <input
                      type="text"
                      required
                      placeholder={t("idTazkiraPlaceholder")}
                    />
                  </div>
                  <div className="form-group">
                    <label>{t("phoneNumber")}</label>
                    <input
                      type="tel"
                      required
                      placeholder={t("phoneNumberPlaceholder")}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>{t("homeAddress")}</label>
                    <input
                      type="text"
                      required
                      placeholder={t("homeAddressPlaceholder")}
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
