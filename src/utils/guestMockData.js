/**
 * Guest Mock Data Store & Mock API Handler for Heavy Sarafi DB
 * Allows running 100% offline client-side sandbox testing (e.g. on Vercel)
 * without requiring a running Node.js server or MongoDB database.
 */

const STORAGE_KEYS = {
  CUSTOMERS: "guest_mock_customers",
  HAWALAS: "guest_mock_hawalas",
  EXCHANGES: "guest_mock_exchanges",
  KAHATA: "guest_mock_kahata",
  VAULT: "guest_mock_vault",
  EXPENSES: "guest_mock_expenses",
  USERS: "guest_mock_users",
};

// --- INITIAL SEED DATA ---
const INITIAL_CUSTOMERS = [
  { id: "CUST-1001", name: "Ahmad Wali", fatherName: "Mohammad Wali", phone: "0799123456", idNumber: "T-100293", branch: "Kabul Branch", createdAt: "2026-07-10T10:00:00Z" },
  { id: "CUST-1002", name: "Mohammad Omar", fatherName: "Abdul Rahim", phone: "0788654321", idNumber: "T-482019", branch: "Kabul Branch", createdAt: "2026-07-12T11:30:00Z" },
  { id: "CUST-1003", name: "Sharif Khan", fatherName: "Jan Mohammad", phone: "0777112233", idNumber: "T-993812", branch: "Herat Main", createdAt: "2026-07-14T09:15:00Z" },
  { id: "CUST-1004", name: "Habibullah Safi", fatherName: "Gulzar Safi", phone: "0700445566", idNumber: "T-221948", branch: "Mazar Branch", createdAt: "2026-07-15T14:20:00Z" },
  { id: "CUST-1005", name: "Zubair Ahmad", fatherName: "Shah Mahmood", phone: "0744998877", idNumber: "T-551029", branch: "Dubai Branch", createdAt: "2026-07-18T16:45:00Z" },
];

const INITIAL_HAWALAS = [
  {
    id: "SHW-5012",
    type: "sent",
    date: "2026-07-20",
    senderBranch: "Kabul Branch",
    destinationBranch: "Herat Main",
    senderName: "Ahmad Wali",
    senderFather: "Mohammad Wali",
    senderPhone: "0799123456",
    senderIdNum: "T-100293",
    receiverName: "Sharif Khan",
    receiverFather: "Jan Mohammad",
    receiverPhone: "0777112233",
    receiverExpectedId: "T-993812",
    amount: 5000,
    currency: "USD",
    fee: 25,
    fundingSource: "sarafi",
    status: "Sent - Pending Payout",
    createdAt: "2026-07-20T08:30:00Z"
  },
  {
    id: "HW-9023",
    type: "received",
    date: "2026-07-21",
    senderBranch: "Dubai Branch",
    destinationBranch: "Kabul Branch",
    senderName: "Zubair Ahmad",
    senderFather: "Shah Mahmood",
    senderPhone: "0744998877",
    senderIdNum: "T-551029",
    receiverName: "Mohammad Omar",
    receiverFather: "Abdul Rahim",
    receiverPhone: "0788654321",
    receiverExpectedId: "T-482019",
    amount: 350000,
    currency: "AFN",
    fee: 1000,
    fundingSource: "sarafi",
    status: "Pending",
    createdAt: "2026-07-21T11:00:00Z"
  },
  {
    id: "SHW-5013",
    type: "sent",
    date: "2026-07-22",
    senderBranch: "Mazar Branch",
    destinationBranch: "Kabul Branch",
    senderName: "Habibullah Safi",
    senderFather: "Gulzar Safi",
    senderPhone: "0700445566",
    senderIdNum: "T-221948",
    receiverName: "Ahmad Wali",
    receiverFather: "Mohammad Wali",
    receiverPhone: "0799123456",
    receiverExpectedId: "T-100293",
    amount: 120000,
    currency: "PKR",
    fee: 500,
    fundingSource: "sarafi",
    skipVaultCredit: true,
    status: "Sent - Pending Payout",
    createdAt: "2026-07-22T14:15:00Z"
  }
];

const INITIAL_EXCHANGES = [
  { id: "EX-8001", clientName: "Ahmad Wali", fromAmount: 1000, fromCurrency: "USD", toAmount: 71500, toCurrency: "AFN", rate: 71.5, date: "2026-07-22", createdAt: "2026-07-22T12:00:00Z" },
  { id: "EX-8002", clientName: "Mohammad Omar", fromAmount: 50000, fromCurrency: "AFN", toAmount: 18500, toCurrency: "PKR", rate: 0.37, date: "2026-07-23", createdAt: "2026-07-23T09:30:00Z" }
];

const INITIAL_KAHATA = [
  {
    id: "KHT-101",
    name: "Kabul Central Sarafi Account",
    currency: "USD",
    netBalance: 15400,
    phone: "0799123456",
    branch: "Kabul Branch",
    transactions: [
      { id: "TXN-1", type: "Credit", amount: 15400, description: "Initial opening deposit", date: "2026-07-01" }
    ]
  },
  {
    id: "KHT-102",
    name: "Afghan National Trading Co.",
    currency: "AFN",
    netBalance: 2500000,
    phone: "0788654321",
    branch: "Kabul Branch",
    transactions: [
      { id: "TXN-1", type: "Credit", amount: 2500000, description: "Capital deposit", date: "2026-07-05" }
    ]
  }
];

const INITIAL_VAULT = [
  { id: "SF-10001", type: "Credit", location: "Primary Vault (Safe)", amount: 10000, currency: "USD", description: "Vault initial cash reserve", date: "2026-07-01", recordedBy: "Demo Admin", branch: "Kabul Branch" },
  { id: "SF-10002", type: "Credit", location: "Primary Vault (Safe)", amount: 1500000, currency: "AFN", description: "Vault initial AFN float", date: "2026-07-01", recordedBy: "Demo Admin", branch: "Kabul Branch" }
];

const INITIAL_EXPENSES = [
  { id: "EXP-301", category: "Office Rent", categoryId: "rent", description: "Kabul Office Monthly Rent", amount: 500, currency: "USD", date: "2026-07-01", recordedBy: "Demo Admin", branch: "Kabul Branch" },
  { id: "EXP-302", category: "Utilities & Internet", categoryId: "utilities", description: "High-speed fiber & electricity bill", amount: 12000, currency: "AFN", date: "2026-07-15", recordedBy: "Demo Admin", branch: "Kabul Branch" }
];

const INITIAL_USERS = [
  { id: "USR-1", username: "guest", name: "Guest Demo User", role: "owner", branch: "Kabul Branch", phone: "0700000000" },
  { id: "USR-2", username: "kabul_manager", name: "Kabul Branch Manager", role: "manager", branch: "Kabul Branch", phone: "0799111222" },
  { id: "USR-3", username: "herat_teller", name: "Herat Staff Teller", role: "employee", branch: "Herat Main", phone: "0788333444" }
];

// --- STORAGE HELPERS ---
const getStorageItem = (key, defaultVal) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultVal;
  } catch (err) {
    return defaultVal;
  }
};

const setStorageItem = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error("LocalStorage set error:", err);
  }
};

// Seed initial mock data into localStorage if absent
export const initGuestData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) setStorageItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  if (!localStorage.getItem(STORAGE_KEYS.HAWALAS)) setStorageItem(STORAGE_KEYS.HAWALAS, INITIAL_HAWALAS);
  if (!localStorage.getItem(STORAGE_KEYS.EXCHANGES)) setStorageItem(STORAGE_KEYS.EXCHANGES, INITIAL_EXCHANGES);
  if (!localStorage.getItem(STORAGE_KEYS.KAHATA)) setStorageItem(STORAGE_KEYS.KAHATA, INITIAL_KAHATA);
  if (!localStorage.getItem(STORAGE_KEYS.VAULT)) setStorageItem(STORAGE_KEYS.VAULT, INITIAL_VAULT);
  if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) setStorageItem(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) setStorageItem(STORAGE_KEYS.USERS, INITIAL_USERS);
};

// Extract field value from object or FormData
const parseField = (data, field) => {
  if (!data) return "";
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    return data.get(field) || "";
  }
  return data[field] || "";
};

// --- GUEST REQUEST ROUTER ---
export const handleGuestRequest = async (config) => {
  initGuestData();

  const method = (config.method || "get").toLowerCase();
  const rawUrl = config.url || "";
  // Strip query string for path matching
  const urlPath = rawUrl.split("?")[0].replace(/^https?:\/\/[^\/]+/, "").replace(/^\/api/, "");
  
  // Extract query parameters
  const queryString = rawUrl.includes("?") ? rawUrl.split("?")[1] : "";
  const queryParams = new URLSearchParams(queryString);
  const userBranch = localStorage.getItem("userBranch") || "Kabul Branch";

  // Helper response wrapper
  const makeRes = (data, status = 200) => ({
    data,
    status,
    statusText: status === 200 || status === 201 ? "OK" : "Error",
    headers: {},
    config,
  });

  // Delay simulation for realistic feel (80ms)
  await new Promise((resolve) => setTimeout(resolve, 80));

  // --- AUTH ENDPOINTS ---
  if (urlPath === "/auth/me") {
    const userRole = localStorage.getItem("userRole") || "owner";
    return makeRes({
      id: "guest-user",
      username: "guest",
      name: "Guest Demo User",
      role: userRole,
      branch: userBranch,
      isGuest: true
    });
  }

  if (urlPath === "/auth/login") {
    localStorage.setItem("isGuest", "true");
    localStorage.setItem("userRole", "owner");
    localStorage.setItem("userBranch", "Kabul Branch");
    return makeRes({
      id: "guest-user",
      username: "guest",
      name: "Guest Demo User",
      role: "owner",
      branch: "Kabul Branch",
      isGuest: true
    });
  }

  if (urlPath === "/auth/logout") {
    localStorage.removeItem("isGuest");
    return makeRes({ message: "Logged out from guest mode." });
  }

  if (urlPath === "/users" || urlPath === "/auth/users") {
    if (method === "get") {
      const users = getStorageItem(STORAGE_KEYS.USERS, INITIAL_USERS);
      return makeRes(users);
    }
    if (method === "post") {
      const users = getStorageItem(STORAGE_KEYS.USERS, INITIAL_USERS);
      const newUser = {
        id: `USR-${Date.now()}`,
        username: parseField(config.data, "username"),
        name: parseField(config.data, "name"),
        role: parseField(config.data, "role") || "employee",
        branch: parseField(config.data, "branch") || userBranch,
        phone: parseField(config.data, "phone") || "",
      };
      users.push(newUser);
      setStorageItem(STORAGE_KEYS.USERS, users);
      return makeRes(newUser, 201);
    }
  }

  // --- CUSTOMERS ENDPOINTS ---
  if (urlPath === "/customers" || urlPath.startsWith("/customers/")) {
    let customers = getStorageItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);

    if (method === "get") {
      const search = queryParams.get("search");
      if (search) {
        const q = search.toLowerCase();
        customers = customers.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.phone && c.phone.includes(q)) ||
            (c.idNumber && c.idNumber.toLowerCase().includes(q))
        );
      }
      return makeRes(customers);
    }

    if (method === "post") {
      const newCust = {
        id: `CUST-${Date.now()}`,
        name: parseField(config.data, "name"),
        fatherName: parseField(config.data, "fatherName"),
        phone: parseField(config.data, "phone"),
        idNumber: parseField(config.data, "idNumber"),
        branch: parseField(config.data, "branch") || userBranch,
        createdAt: new Date().toISOString(),
      };
      customers.unshift(newCust);
      setStorageItem(STORAGE_KEYS.CUSTOMERS, customers);
      return makeRes(newCust, 201);
    }

    if (method === "delete") {
      const id = urlPath.split("/")[2];
      customers = customers.filter((c) => c.id !== id && c._id !== id);
      setStorageItem(STORAGE_KEYS.CUSTOMERS, customers);
      return makeRes({ message: "Customer deleted successfully." });
    }
  }

  // --- HAWALAS ENDPOINTS ---
  if (urlPath === "/hawalas" || urlPath.startsWith("/hawalas/")) {
    let hawalas = getStorageItem(STORAGE_KEYS.HAWALAS, INITIAL_HAWALAS);

    // GET /hawalas
    if (method === "get") {
      const type = queryParams.get("type");
      const search = queryParams.get("search");

      if (type === "sent") {
        hawalas = hawalas.filter(
          (h) => h.type === "sent" && h.senderBranch?.toLowerCase().includes(userBranch.toLowerCase())
        );
      } else if (type === "received") {
        hawalas = hawalas.filter(
          (h) => h.destinationBranch === userBranch
        );
      } else {
        hawalas = hawalas.filter(
          (h) => h.senderBranch === userBranch || h.destinationBranch === userBranch
        );
      }

      if (search) {
        const q = search.toLowerCase();
        hawalas = hawalas.filter(
          (h) =>
            h.id.toLowerCase().includes(q) ||
            h.senderName?.toLowerCase().includes(q) ||
            h.receiverName?.toLowerCase().includes(q)
        );
      }
      return makeRes(hawalas);
    }

    // POST /hawalas
    if (method === "post") {
      const type = parseField(config.data, "type") || "sent";
      const amount = parseFloat(parseField(config.data, "amount") || "0");
      const fee = parseFloat(parseField(config.data, "fee") || "0");
      const skipVaultCredit = parseField(config.data, "skipVaultCredit") === "true" || parseField(config.data, "skipVaultCredit") === true;

      const prefix = type === "sent" ? "SHW" : "HW";
      const newHawala = {
        id: `${prefix}-${Math.floor(5000 + Math.random() * 4000)}`,
        type,
        date: parseField(config.data, "date") || new Date().toISOString().split("T")[0],
        senderBranch: parseField(config.data, "senderBranch") || userBranch,
        destinationBranch: parseField(config.data, "destinationBranch"),
        senderName: parseField(config.data, "senderName"),
        senderFather: parseField(config.data, "senderFather"),
        senderPhone: parseField(config.data, "senderPhone"),
        senderIdNum: parseField(config.data, "senderIdNum"),
        receiverName: parseField(config.data, "receiverName"),
        receiverFather: parseField(config.data, "receiverFather"),
        receiverPhone: parseField(config.data, "receiverPhone"),
        receiverExpectedId: parseField(config.data, "receiverExpectedId"),
        amount,
        currency: parseField(config.data, "currency") || "USD",
        fee,
        fundingSource: parseField(config.data, "fundingSource") || "sarafi",
        kahataAccountId: parseField(config.data, "kahataAccountId"),
        skipVaultCredit,
        status: type === "sent" ? "Sent - Pending Payout" : "Pending",
        createdAt: new Date().toISOString(),
      };

      hawalas.unshift(newHawala);
      setStorageItem(STORAGE_KEYS.HAWALAS, hawalas);

      // Record vault credit if not skipped
      if (type === "sent" && !skipVaultCredit) {
        const vault = getStorageItem(STORAGE_KEYS.VAULT, INITIAL_VAULT);
        vault.unshift({
          id: `SF-${Math.floor(10000 + Math.random() * 9000)}`,
          date: newHawala.date,
          type: "Credit",
          location: "Primary Vault (Safe)",
          amount: newHawala.amount,
          currency: newHawala.currency,
          description: `Hawala ${newHawala.id} received from ${newHawala.senderName} → ${newHawala.destinationBranch}`,
          recordedBy: "Guest Demo User",
          branch: userBranch,
        });
        if (newHawala.fee > 0) {
          vault.unshift({
            id: `SF-${Math.floor(10000 + Math.random() * 9000)}`,
            date: newHawala.date,
            type: "Credit",
            location: "Primary Vault (Safe)",
            amount: newHawala.fee,
            currency: newHawala.currency,
            description: `Commission earned on Hawala ${newHawala.id}`,
            recordedBy: "Guest Demo User",
            branch: userBranch,
          });
        }
        setStorageItem(STORAGE_KEYS.VAULT, vault);
      }

      return makeRes(newHawala, 201);
    }

    // PUT /hawalas/:id/payout
    if (method === "put" && urlPath.endsWith("/payout")) {
      const parts = urlPath.split("/");
      const id = parts[2];
      const target = hawalas.find((h) => h.id === id || h._id === id);
      if (target) {
        target.status = "Paid Out";
        setStorageItem(STORAGE_KEYS.HAWALAS, hawalas);

        // Record vault debit for payout if funding is safe
        if (target.fundingSource === "sarafi") {
          const vault = getStorageItem(STORAGE_KEYS.VAULT, INITIAL_VAULT);
          vault.unshift({
            id: `SF-${Math.floor(10000 + Math.random() * 9000)}`,
            date: new Date().toISOString().split("T")[0],
            type: "Debit",
            location: "Primary Vault (Safe)",
            amount: target.amount,
            currency: target.currency,
            description: `Hawala ${target.id} paid to ${target.receiverName} (sent from ${target.senderBranch})`,
            recordedBy: "Guest Demo User",
            branch: userBranch,
          });
          setStorageItem(STORAGE_KEYS.VAULT, vault);
        }
        return makeRes(target);
      }
      return makeRes({ message: "Hawala not found" }, 404);
    }

    // DELETE /hawalas/:id
    if (method === "delete") {
      const id = urlPath.split("/")[2];
      hawalas = hawalas.filter((h) => h.id !== id && h._id !== id);
      setStorageItem(STORAGE_KEYS.HAWALAS, hawalas);
      return makeRes({ message: "Hawala deleted successfully." });
    }
  }

  // --- CURRENCY EXCHANGES ENDPOINTS ---
  if (urlPath === "/exchanges" || urlPath.startsWith("/exchanges/")) {
    let exchanges = getStorageItem(STORAGE_KEYS.EXCHANGES, INITIAL_EXCHANGES);

    if (method === "get") return makeRes(exchanges);

    if (method === "post") {
      const newEx = {
        id: `EX-${Math.floor(8000 + Math.random() * 1000)}`,
        clientName: parseField(config.data, "clientName") || "Walk-in Customer",
        fromAmount: parseFloat(parseField(config.data, "fromAmount")),
        fromCurrency: parseField(config.data, "fromCurrency"),
        toAmount: parseFloat(parseField(config.data, "toAmount")),
        toCurrency: parseField(config.data, "toCurrency"),
        rate: parseFloat(parseField(config.data, "rate")),
        date: parseField(config.data, "date") || new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      };
      exchanges.unshift(newEx);
      setStorageItem(STORAGE_KEYS.EXCHANGES, exchanges);
      return makeRes(newEx, 201);
    }

    if (method === "delete") {
      const id = urlPath.split("/")[2];
      exchanges = exchanges.filter((e) => e.id !== id && e._id !== id);
      setStorageItem(STORAGE_KEYS.EXCHANGES, exchanges);
      return makeRes({ message: "Exchange record deleted." });
    }
  }

  // --- KAHATA ENDPOINTS ---
  if (urlPath === "/kahata" || urlPath.startsWith("/kahata/")) {
    let kahata = getStorageItem(STORAGE_KEYS.KAHATA, INITIAL_KAHATA);

    if (method === "get") return makeRes(kahata);

    if (method === "post" && !urlPath.includes("/transaction")) {
      const newAcc = {
        id: `KHT-${Math.floor(100 + Math.random() * 900)}`,
        name: parseField(config.data, "name"),
        currency: parseField(config.data, "currency") || "USD",
        phone: parseField(config.data, "phone"),
        branch: parseField(config.data, "branch") || userBranch,
        netBalance: parseFloat(parseField(config.data, "initialBalance") || "0"),
        transactions: []
      };
      kahata.unshift(newAcc);
      setStorageItem(STORAGE_KEYS.KAHATA, kahata);
      return makeRes(newAcc, 201);
    }

    if (method === "post" && urlPath.includes("/transaction")) {
      const id = urlPath.split("/")[2];
      const target = kahata.find((k) => k.id === id || k._id === id);
      if (target) {
        const type = parseField(config.data, "type");
        const amount = parseFloat(parseField(config.data, "amount") || "0");
        target.transactions.unshift({
          id: `TXN-${target.transactions.length + 1}`,
          type,
          amount,
          description: parseField(config.data, "description"),
          date: parseField(config.data, "date") || new Date().toISOString().split("T")[0]
        });
        if (type === "Credit") target.netBalance += amount;
        else target.netBalance -= amount;

        setStorageItem(STORAGE_KEYS.KAHATA, kahata);
        return makeRes(target);
      }
    }

    if (method === "delete") {
      const id = urlPath.split("/")[2];
      kahata = kahata.filter((k) => k.id !== id && k._id !== id);
      setStorageItem(STORAGE_KEYS.KAHATA, kahata);
      return makeRes({ message: "Kahata account deleted." });
    }
  }

  // --- SARAFI VAULT / SAFE TRANSACTIONS ---
  if (urlPath === "/safes/balances") {
    const vault = getStorageItem(STORAGE_KEYS.VAULT, INITIAL_VAULT);
    const LOCATIONS = ["Primary Vault (Safe)", "Secondary Safe", "Cash Drawer"];
    const CURRENCIES = ["AFN", "USD", "EUR"];
    const balances = [];

    LOCATIONS.forEach((loc) => {
      CURRENCIES.forEach((cur) => {
        let balance = 0;
        vault.forEach((tx) => {
          if (tx.location === loc && tx.currency === cur) {
            if (tx.type === "Credit") balance += tx.amount;
            else if (tx.type === "Debit") balance -= tx.amount;
          }
        });
        balances.push({ location: loc, currency: cur, balance });
      });
    });
    return makeRes(balances);
  }

  if (
    urlPath === "/safes" ||
    urlPath.startsWith("/safes/") ||
    urlPath === "/safe-transactions" ||
    urlPath.startsWith("/safe-transactions/")
  ) {
    let vault = getStorageItem(STORAGE_KEYS.VAULT, INITIAL_VAULT);

    if (method === "get") return makeRes(vault);

    if (method === "post") {
      const newTx = {
        id: `SF-${Math.floor(10000 + Math.random() * 9000)}`,
        date: parseField(config.data, "date") || new Date().toISOString().split("T")[0],
        type: parseField(config.data, "type") || "Credit",
        location: parseField(config.data, "location") || "Primary Vault (Safe)",
        amount: parseFloat(parseField(config.data, "amount") || "0"),
        currency: parseField(config.data, "currency") || "USD",
        description: parseField(config.data, "description"),
        recordedBy: "Guest Demo User",
        branch: userBranch,
        createdAt: new Date().toISOString()
      };
      vault.unshift(newTx);
      setStorageItem(STORAGE_KEYS.VAULT, vault);
      return makeRes(newTx, 201);
    }

    if (method === "delete") {
      const id = urlPath.split("/")[2];
      vault = vault.filter((v) => v.id !== id && v._id !== id);
      setStorageItem(STORAGE_KEYS.VAULT, vault);
      return makeRes({ message: "Vault transaction deleted." });
    }
  }

  // --- EXPENSES ENDPOINTS ---
  if (urlPath === "/expenses" || urlPath.startsWith("/expenses/")) {
    let expenses = getStorageItem(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);

    if (method === "get") return makeRes(expenses);

    if (method === "post") {
      const newExp = {
        id: `EXP-${Math.floor(300 + Math.random() * 700)}`,
        category: parseField(config.data, "category"),
        description: parseField(config.data, "description"),
        amount: parseFloat(parseField(config.data, "amount") || "0"),
        currency: parseField(config.data, "currency") || "AFN",
        date: parseField(config.data, "date") || new Date().toISOString().split("T")[0],
        branch: userBranch
      };
      expenses.unshift(newExp);
      setStorageItem(STORAGE_KEYS.EXPENSES, expenses);
      return makeRes(newExp, 201);
    }

    if (method === "delete") {
      const id = urlPath.split("/")[2];
      expenses = expenses.filter((e) => e.id !== id && e._id !== id);
      setStorageItem(STORAGE_KEYS.EXPENSES, expenses);
      return makeRes({ message: "Expense deleted." });
    }
  }

  // Fallback empty success for any unhandled routes
  return makeRes({ success: true, isGuestMock: true });
};
