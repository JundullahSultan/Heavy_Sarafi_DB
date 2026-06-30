// src/pages/AllUsers.jsx
import React, { useState } from "react";
import "./AllUsers.css";
import { getRole, ROLES } from "../utils/auth";
import { useLanguage } from "../context/LanguageContext";

export default function AllUsers() {
  const { t } = useLanguage();
  const currentUserRole = getRole();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");

  // Mock Data for Staff
  const [users, setUsers] = useState([
    {
      id: "USR-001",
      name: "Jundullah (You)",
      role: "owner",
      branch: "Global",
      phone: "0799000000",
      status: "Active",
      lastLogin: "Today, 09:30 AM",
    },
    {
      id: "USR-002",
      name: "Ahmad Tariq",
      role: "manager",
      branch: "Kabul Branch",
      phone: "0700111222",
      status: "Active",
      lastLogin: "Today, 08:15 AM",
    },
    {
      id: "USR-003",
      name: "Farooq Hassan",
      role: "employee",
      branch: "Herat Main",
      phone: "0777333444",
      status: "Active",
      lastLogin: "Yesterday, 04:00 PM",
    },
    {
      id: "USR-004",
      name: "Zalmay Khan",
      role: "employee",
      branch: "Kabul Branch",
      phone: "0788555666",
      status: "Suspended",
      lastLogin: "2026-06-20",
    },
  ]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch =
      branchFilter === "All" || user.branch === branchFilter;
    return matchesSearch && matchesBranch;
  });

  const handleAddUser = (e) => {
    e.preventDefault();
    alert(t("newUserCreated"));
    setIsAddModalOpen(false);
  };

  const toggleUserStatus = (id) => {
    setUsers(
      users.map((user) => {
        if (user.id === id) {
          if (user.role === ROLES.OWNER) {
            alert(t("ownerCannotSuspend"));
            return user;
          }
          return {
            ...user,
            status: user.status === "Active" ? "Suspended" : "Active",
          };
        }
        return user;
      }),
    );
  };

  const resetPassword = (name) => {
    alert(`${t("temporaryPassword")} ${name}.`);
  };

  return (
    <div className="list-container">
      <div className="list-header" style={{ alignItems: "flex-end" }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: "0.25rem" }}>
            {t("staffUserManagement")}
          </h2>
          <p className="helper-text">{t("manageBranchAccess")}</p>
        </div>

        <div className="header-actions-group">
          <div className="search-bar">
            <input
              type="text"
              placeholder={t("searchNameOrId")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="branch-filter"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="All">{t("allBranches")}</option>
            <option value="Kabul Branch">Kabul Branch</option>
            <option value="Herat Main">Herat Main</option>
            <option value="Dubai Branch">Dubai Branch</option>
          </select>
          <button
            className="action-btn submit-btn fw-bold"
            onClick={() => setIsAddModalOpen(true)}
          >
            {t("addNewStaff")}
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="hawala-table">
          <thead>
            <tr>
              <th>{t("userId")}</th>
              <th>{t("fullName")}</th>
              <th>{t("role")}</th>
              <th>{t("assignedBranch")}</th>
              <th>{t("contactPhone")}</th>
              <th>{t("status")}</th>
              <th style={{ textAlign: "right" }}>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className={user.status === "Suspended" ? "suspended-row" : ""}
              >
                <td className="fw-bold text-light">{user.id}</td>
                <td className="fw-bold">
                  {user.name}
                  <div
                    className="helper-text"
                    style={{ fontSize: "0.75rem", marginTop: "2px" }}
                  >
                    {t("date")}: {user.lastLogin}
                  </div>
                </td>
                <td>
                  <span className={`role-tag ${user.role}`}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td>{user.branch}</td>
                <td>{user.phone}</td>
                <td>
                  <span
                    className={`status-badge ${user.status === "Active" ? "paid" : "danger"}`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    className="action-btn secondary small-btn"
                    onClick={() => resetPassword(user.name)}
                    disabled={user.status === "Suspended"}
                  >
                    {t("resetPassword")}
                  </button>
                  <button
                    className={`action-btn small-btn ${user.status === "Active" ? "danger" : "submit-btn"}`}
                    onClick={() => toggleUserStatus(user.id)}
                  >
                    {user.status === "Active" ? t("suspend") : t("reactivate")}
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  {t("noStaffFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- ADD NEW USER MODAL --- */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="modal-content small-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{t("createNewStaffAccount")}</h3>
              <button
                className="close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddUser}>
              <div
                className="modal-body padded-body"
                style={{ display: "block" }}
              >
                <div className="form-input-group mb-3">
                  <label>{t("fullName")}</label>
                  <input type="text" required placeholder="e.g., Omar Hassan" />
                </div>

                <div className="form-grid-2 mb-3">
                  <div className="form-input-group">
                    <label>{t("role")}</label>
                    <select required>
                      <option value="employee">{t("employee")}</option>
                      <option value="manager">{t("manager")}</option>
                      {currentUserRole === ROLES.OWNER && (
                        <option value="owner">{t("owner")}</option>
                      )}
                    </select>
                  </div>
                  <div className="form-input-group">
                    <label>{t("branchAssignment")}</label>
                    <select required>
                      <option value="">{t("selectBranch")}</option>
                      <option value="Kabul Branch">Kabul Branch</option>
                      <option value="Herat Main">Herat Main</option>
                      <option value="Dubai Branch">Dubai Branch</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-input-group">
                    <label>
                      {t("phoneNumber")} ({t("username")})
                    </label>
                    <input type="text" required placeholder="07XX XXX XXX" />
                  </div>
                  <div className="form-input-group">
                    <label>{t("initialPassword")}</label>
                    <input
                      type="text"
                      required
                      placeholder={t("willBeForcedToChange")}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="action-btn secondary auto-width"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="action-btn submit-btn auto-width"
                >
                  {t("createAccount")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
