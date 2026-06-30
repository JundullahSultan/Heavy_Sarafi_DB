// src/utils/auth.js

// Define constants for roles to avoid magic strings and typos
export const ROLES = {
  OWNER: "owner",
  MANAGER: "manager",
  EMPLOYEE: "employee",
};

/**
 * Retrieves the user's role from local storage.
 * @returns {string | null} The user's role or null if not found.
 */
export const getRole = () => {
  try {
    const role = localStorage.getItem("userRole");
    // For the initial run, if no role is set, default to Employee for demonstration
    if (!role) {
      localStorage.setItem("userRole", ROLES.EMPLOYEE);
      return ROLES.EMPLOYEE;
    }
    return role;
  } catch (error) {
    console.error("Could not access local storage:", error);
    return null;
  }
};

/**
 * Saves the user's role to local storage.
 * @param {string} role - The role to save (e.g., 'owner', 'manager', 'employee').
 */
export const setRole = (role) => {
  try {
    // A simple check to ensure only valid roles are set
    if (Object.values(ROLES).includes(role)) {
      localStorage.setItem("userRole", role);
      // We reload the page to apply the changes immediately for this demo
      window.location.reload();
    } else {
      console.error("Attempted to set an invalid role:", role);
    }
  } catch (error) {
    console.error("Could not access local storage:", error);
  }
};

/**
 * Removes the user's role from local storage (e.g., on logout).
 */
export const clearRole = () => {
  try {
    localStorage.removeItem("userRole");
  } catch (error) {
    console.error("Could not access local storage:", error);
  }
};
