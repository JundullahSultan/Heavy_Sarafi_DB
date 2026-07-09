import React, { useState, useEffect } from "react";
import { getRole, ROLES } from "../utils/auth";
import { useLanguage } from "../context/LanguageContext";
import API from "../utils/api";
import "./AllUsers.css";

export default function AllUsers() {
  const { t } = useLanguage();
  const currentUserRole = getRole();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");

  // Form Fields for adding mock user (or mapping firebase manually in dev)
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState("employee");
  const [newUserBranch, setNewUserBranch] = useState("Kabul Branch");
  const [newUserPhone, setNewUserPhone] = useState("");

  // Fetch all staff users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await API.get("/auth/users");
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    if (currentUserRole === ROLES.OWNER) {
      fetchUsers();
    }
  }, [currentUserRole]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.uid.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch =
      branchFilter === "All" || user.branch === branchFilter;
    return matchesSearch && matchesBranch;
  });

  const handleAddUser = async (e) => {
    e.preventDefault();
    // Simulate user creation (In firebase integration, they would sign up via Firebase client SDK)
    alert("In Firebase Auth setup, you would call firebase client auth to sign up a user, then register their role.");
    setIsAddModalOpen(false);
  };

  const toggleUserStatus = async (uid, currentStatus) => {
    const nextStatus = currentStatus === "Active" ? "Suspended" : "Active";
    try {
      const res = await API.put(`/auth/users/${uid}/status`, { status: nextStatus });
      setUsers((prev) =>
        prev.map((user) => (user.uid === uid ? res.data : user))
      );
    } catch (err) {
      console.error("Error toggling user status:", err);
      alert(err.response?.data?.message || err.message);
    }
  };

  const resetPassword = (name) => {
    alert(`${t("temporaryPassword")} ${name}.`);
  };

  if (currentUserRole !== ROLES.OWNER) {
    return <div className="content-area">Access Denied. Owners only.</div>;
  }

  return (
    <div className="list-container">
      <div className="list-header" style={{ alignItems: "flex-end" }}>
        <div>
          <h2 className="section-title" style={{ marginBottom: "0.25rem" }}>
            {t("staffUserManagement")}
          </h2>
          <p className="helper-text">{t("manageBranchAccess")}</p>
        </div>

        <div className="header-actions-group user-filter-actions">
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
          <div className="search-bar">
            <input
              type="text"
              placeholder={t("searchNameOrId")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="action-btn submit-btn fw-bold"
            onClick={() => setIsAddModalOpen(true)}
          >
            {t("addNewStaff")}
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div className="empty-state">Loading staff accounts...</div>
        ) : (
          <table className="hawala-table">
            <thead>
              <tr>
                <th>UID</th>
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
                  key={user.uid}
                  className={user.status === "Suspended" ? "suspended-row" : ""}
                >
                  <td className="fw-bold text-light" style={{ fontSize: "0.8rem" }}>
                    {user.uid.slice(0, 10)}...
                  </td>
                  <td className="fw-bold">
                    {user.name}
                    <div
                      className="helper-text"
                      style={{ fontSize: "0.75rem", marginTop: "2px" }}
                    >
                      Last Login: {new Date(user.lastLogin || Date.now()).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <span className={`role-tag ${user.role}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td>{user.branch}</td>
                  <td>{user.phone || "—"}</td>
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
                      onClick={() => toggleUserStatus(user.uid, user.status)}
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
        )}
      </div>

      {/* --- Create User Modal --- */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="modal-content add-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "550px" }}
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
              <div className="modal-body">
                <div className="form-group">
                  <label>{t("fullName")}</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Branch Assignment</label>
                  <select
                    value={newUserBranch}
                    onChange={(e) => setNewUserBranch(e.target.value)}
                  >
                    <option value="Kabul Branch">Kabul Branch</option>
                    <option value="Herat Main">Herat Main</option>
                    <option value="Dubai Branch">Dubai Branch</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                  />
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
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
