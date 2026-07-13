import React, { useState, useEffect } from "react";
import { getRole, ROLES } from "../utils/auth";
import { useLanguage } from "../context/LanguageContext";
import { usePopup } from "../context/PopupContext";
import API from "../utils/api";
import "./AllUsers.css";

export default function AllUsers() {
  const { t } = useLanguage();
  const { showAlert, showToast } = usePopup();
  const currentUserRole = getRole();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");

  // Form Fields for adding user
  const [newUserName, setNewUserName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
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
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user._id && user._id.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesBranch =
      branchFilter === "All" || user.branch === branchFilter;
    return matchesSearch && matchesBranch;
  });

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUsername.trim() || !newUserPassword) return;

    const tempId = `USR-TEMP-${Date.now()}`;
    const tempUser = {
      _id: tempId,
      name: newUserName.trim(),
      username: newUsername.trim().toLowerCase(),
      role: newUserRole,
      branch: newUserBranch,
      phone: newUserPhone.trim(),
      status: "Active",
      lastLogin: null,
      createdAt: new Date().toISOString(),
    };

    // 1. Instantly update UI state and close modal
    setUsers((prev) => [tempUser, ...prev]);
    setIsAddModalOpen(false);

    // Save inputs for recovery
    const savedInputs = {
      name: newUserName,
      username: newUsername,
      password: newUserPassword,
      role: newUserRole,
      branch: newUserBranch,
      phone: newUserPhone,
    };

    // Reset fields immediately
    setNewUserName("");
    setNewUsername("");
    setNewUserPassword("");
    setNewUserPhone("");

    showToast("Creating staff account...", { severity: "info", duration: 1500 });

    try {
      const payload = {
        name: savedInputs.name.trim(),
        username: savedInputs.username.trim().toLowerCase(),
        password: savedInputs.password,
        role: savedInputs.role,
        branch: savedInputs.branch,
        phone: savedInputs.phone.trim(),
      };
      
      const res = await API.post("/auth/register", payload);
      // Replace optimistic temp user with actual saved user
      setUsers((prev) => prev.map((u) => (u._id === tempId ? res.data : u)));
      showToast("Staff account created successfully!", { severity: "success" });
    } catch (err) {
      console.error("Error registering user:", err);
      // Rollback optimistic user
      setUsers((prev) => prev.filter((u) => u._id !== tempId));
      // Re-populate modal inputs and reopen modal
      setNewUserName(savedInputs.name);
      setNewUsername(savedInputs.username);
      setNewUserPassword(savedInputs.password);
      setNewUserRole(savedInputs.role);
      setNewUserBranch(savedInputs.branch);
      setNewUserPhone(savedInputs.phone);
      setIsAddModalOpen(true);
      showAlert(err.response?.data?.message || err.message);
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "Active" ? "Suspended" : "Active";
    
    // 1. Instantly toggle status in UI state
    setUsers((prev) =>
      prev.map((user) => (user._id === id ? { ...user, status: nextStatus } : user))
    );

    showToast(nextStatus === "Active" ? "Reactivating user..." : "Suspending user...", { severity: "info", duration: 1500 });

    try {
      const res = await API.put(`/auth/users/${id}/status`, { status: nextStatus });
      // Update with actual response data
      setUsers((prev) =>
        prev.map((user) => (user._id === id ? res.data : user))
      );
      showToast(`User status updated to ${nextStatus}`, { severity: "success" });
    } catch (err) {
      console.error("Error toggling user status:", err);
      // Rollback status toggle
      setUsers((prev) =>
        prev.map((user) => (user._id === id ? { ...user, status: currentStatus } : user))
      );
      showAlert(err.response?.data?.message || err.message);
    }
  };

  const resetPassword = (name) => {
    showToast(`${t("temporaryPassword")} ${name}.`, { severity: "success" });
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
          <div className="empty-state" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "150px" }}>
            <div className="loader"></div>
          </div>
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
                  key={user._id || user.username}
                  className={user.status === "Suspended" ? "suspended-row" : ""}
                >
                  <td className="fw-bold text-light" style={{ fontSize: "0.8rem" }}>
                    {user._id ? (user._id.startsWith("USR-TEMP-") ? "TEMP" : user._id.slice(0, 10)) : "—"}
                  </td>
                  <td className="fw-bold">
                    {user.name}
                    <div
                      className="helper-text"
                      style={{ fontSize: "0.75rem", marginTop: "2px" }}
                    >
                      Username: <span className="text-light">{user.username}</span> | Last Login: {new Date(user.lastLogin || Date.now()).toLocaleDateString()}
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
                      disabled={user.status === "Suspended" || (user._id && user._id.startsWith("USR-TEMP-"))}
                    >
                      {t("resetPassword")}
                    </button>
                    <button
                      className={`action-btn small-btn ${user.status === "Active" ? "danger" : "submit-btn"}`}
                      onClick={() => toggleUserStatus(user._id, user.status)}
                      disabled={user._id && user._id.startsWith("USR-TEMP-")}
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
                  <label>Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. jamil"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
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
