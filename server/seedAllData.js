import mongoose from "mongoose";
import dotenv from "dotenv";
import { Customer } from "./models/Customer.js";
import { Expense } from "./models/Expense.js";
import { Hawala } from "./models/Hawala.js";
import { Kahata } from "./models/Kahata.js";
import { SafeTransaction } from "./models/SafeTransaction.js";

dotenv.config();

export const seedData = async () => {
  try {
    console.log("Starting database seeding process...");

    // 1. Clear existing non-user collections to ensure a clean seed of exactly 3 records
    console.log("Clearing existing customers, expenses, hawalas, kahatas, and safe transactions...");
    await Customer.deleteMany({});
    await Expense.deleteMany({});
    await Hawala.deleteMany({});
    await Kahata.deleteMany({});
    await SafeTransaction.deleteMany({});

    // 2. Seed Customers (3 records)
    const customers = [
      {
        id: "CUST-001",
        name: "Ahmad Wali",
        fatherName: "Mohammad Wali",
        phone: "0799123456",
        idNumber: "NID-887766",
        address: "Kabul, Afghanistan",
        idImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image",
        branch: "Kabul Branch",
        registeredDate: "2026-07-01"
      },
      {
        id: "CUST-002",
        name: "Khan Shirin",
        fatherName: "Khan Gul",
        phone: "0788234567",
        idNumber: "NID-998877",
        address: "Herat, Afghanistan",
        idImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image",
        branch: "Herat Main",
        registeredDate: "2026-07-02"
      },
      {
        id: "CUST-003",
        name: "Zabiullah Wardak",
        fatherName: "Naim Wardak",
        phone: "0700345678",
        idNumber: "NID-112233",
        address: "Mazar-i-Sharif, Afghanistan",
        idImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image",
        branch: "Dubai Branch",
        registeredDate: "2026-07-03"
      }
    ];
    await Customer.insertMany(customers);
    console.log("Seeded 3 Customer records.");

    // 3. Seed Expenses (3 records)
    const expenses = [
      {
        id: "EXP-001",
        date: "2026-07-05",
        categoryId: "Rent",
        amount: 800,
        currency: "USD",
        description: "Monthly office building lease rent",
        recordedBy: "kabul",
        branch: "Kabul Branch",
        receiptUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image"
      },
      {
        id: "EXP-002",
        date: "2026-07-06",
        categoryId: "Internet",
        amount: 3500,
        currency: "AFN",
        description: "High-speed fiber internet subscription renewal",
        recordedBy: "herat",
        branch: "Herat Main",
        receiptUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image"
      },
      {
        id: "EXP-003",
        date: "2026-07-07",
        categoryId: "Office Supplies",
        amount: 15000,
        currency: "PKR",
        description: "Purchased office stationery and printer inks",
        recordedBy: "dubai",
        branch: "Dubai Branch",
        receiptUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image"
      }
    ];
    await Expense.insertMany(expenses);
    console.log("Seeded 3 Expense records.");

    // 4. Seed Hawalas (6 records: 3 sent, 3 received to provide adequate visualization across branches)
    const hawalas = [
      // Sent Hawalas
      {
        id: "HW-SENT-001",
        type: "sent",
        date: "2026-07-04",
        senderBranch: "Kabul Branch",
        destinationBranch: "Herat Main",
        senderName: "Ahmad Wali",
        senderPhone: "0799123456",
        senderFather: "Mohammad Wali",
        senderIdNum: "NID-887766",
        senderIdImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image",
        receiverName: "Khan Shirin",
        receiverFather: "Khan Gul",
        receiverIdNum: "NID-998877",
        receiverPhone: "0788234567",
        receiverExpectedId: "NID-998877",
        receiverIdImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image",
        amount: 2500,
        currency: "USD",
        fee: 10,
        status: "Pending",
        fundingSource: "sarafi"
      },
      {
        id: "HW-SENT-002",
        type: "sent",
        date: "2026-07-05",
        senderBranch: "Herat Main",
        destinationBranch: "Kabul Branch",
        senderName: "Khan Shirin",
        senderPhone: "0788234567",
        senderFather: "Khan Gul",
        senderIdNum: "NID-998877",
        senderIdImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image",
        receiverName: "Ahmad Wali",
        receiverFather: "Mohammad Wali",
        receiverIdNum: "NID-887766",
        receiverPhone: "0799123456",
        receiverExpectedId: "NID-887766",
        receiverIdImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image",
        amount: 45000,
        currency: "AFN",
        fee: 200,
        status: "Paid Out",
        fundingSource: "sarafi"
      },
      {
        id: "HW-SENT-003",
        type: "sent",
        date: "2026-07-06",
        senderBranch: "Kabul Branch",
        destinationBranch: "Dubai Branch",
        senderName: "Zabiullah Wardak",
        senderPhone: "0700345678",
        senderFather: "Naim Wardak",
        senderIdNum: "NID-112233",
        senderIdImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image",
        receiverName: "Mohammad Ali",
        receiverFather: "Ali Reza",
        receiverIdNum: "UAE-990011",
        receiverPhone: "+97150123456",
        receiverExpectedId: "UAE-990011",
        receiverIdImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image",
        amount: 10000,
        currency: "AED",
        fee: 50,
        status: "Pending",
        fundingSource: "sarafi"
      },
      // 5 New Sent Hawalas to Herat Main
      {
        id: "SHW-9001",
        type: "sent",
        date: "2026-07-07",
        senderBranch: "Kabul Branch",
        destinationBranch: "Herat Main",
        senderName: "Abdul Rahim",
        senderPhone: "0799887766",
        senderFather: "Abdul Samad",
        senderIdNum: "Tazkira-1122",
        receiverName: "Mohammad Qasim",
        receiverFather: "Mohammad Shah",
        receiverPhone: "0788334455",
        receiverExpectedId: "Tazkira-5566",
        amount: 3500,
        currency: "USD",
        fee: 25,
        status: "Sent - Pending Payout",
        fundingSource: "sarafi"
      },
      {
        id: "SHW-9002",
        type: "sent",
        date: "2026-07-08",
        senderBranch: "Kabul Branch",
        destinationBranch: "Herat Main",
        senderName: "Farhad Amin",
        senderPhone: "0700554433",
        senderFather: "Aminullah",
        senderIdNum: "Tazkira-3344",
        receiverName: "Sayed Omar",
        receiverFather: "Sayed Akbar",
        receiverPhone: "0777221199",
        receiverExpectedId: "Tazkira-7788",
        amount: 150000,
        currency: "AFN",
        fee: 500,
        status: "Sent - Pending Payout",
        fundingSource: "sarafi"
      },
      {
        id: "SHW-9003",
        type: "sent",
        date: "2026-07-09",
        senderBranch: "Kabul Branch",
        destinationBranch: "Herat Main",
        senderName: "Hikmatullah",
        senderPhone: "0766112233",
        senderFather: "Rahmatullah",
        senderIdNum: "Tazkira-8899",
        receiverName: "Naimat Khan",
        receiverFather: "Gul Khan",
        receiverPhone: "0755998877",
        receiverExpectedId: "Tazkira-9900",
        amount: 2000,
        currency: "EUR",
        fee: 20,
        status: "Sent - Pending Payout",
        fundingSource: "sarafi"
      },
      {
        id: "SHW-9004",
        type: "sent",
        date: "2026-07-10",
        senderBranch: "Kabul Branch",
        destinationBranch: "Herat Main",
        senderName: "Zabiullah",
        senderPhone: "0744332211",
        senderFather: "Habibullah",
        senderIdNum: "Tazkira-4455",
        receiverName: "Ahmad Shah",
        receiverFather: "Wali Shah",
        receiverPhone: "0733887766",
        receiverExpectedId: "Tazkira-1234",
        amount: 250000,
        currency: "PKR",
        fee: 1000,
        status: "Sent - Pending Payout",
        fundingSource: "sarafi"
      },
      {
        id: "SHW-9005",
        type: "sent",
        date: "2026-07-11",
        senderBranch: "Kabul Branch",
        destinationBranch: "Herat Main",
        senderName: "Mustafa Qazi",
        senderPhone: "0799443322",
        senderFather: "Qazi Selim",
        senderIdNum: "Tazkira-9988",
        receiverName: "Ehsanullah",
        receiverFather: "Sanaullah",
        receiverPhone: "0788665544",
        receiverExpectedId: "Tazkira-5678",
        amount: 5000,
        currency: "CNY",
        fee: 100,
        status: "Sent - Pending Payout",
        fundingSource: "sarafi"
      },
      // Received Hawalas (incoming to branches)
      {
        id: "HW-REC-001",
        type: "received",
        date: "2026-07-04",
        senderBranch: "Dubai Branch",
        destinationBranch: "Kabul Branch",
        senderName: "Mohammad Ali",
        senderPhone: "+97150123456",
        senderFather: "Ali Reza",
        senderIdNum: "UAE-990011",
        senderIdImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image",
        receiverName: "Ahmad Wali",
        receiverFather: "Mohammad Wali",
        receiverIdNum: "NID-887766",
        receiverPhone: "0799123456",
        receiverExpectedId: "NID-887766",
        receiverIdImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image",
        amount: 1500,
        currency: "USD",
        fee: 5,
        status: "Pending",
        fundingSource: "sarafi"
      },
      {
        id: "HW-REC-002",
        type: "received",
        date: "2026-07-05",
        senderBranch: "Kabul Branch",
        destinationBranch: "Herat Main",
        senderName: "Zabiullah Wardak",
        senderPhone: "0700345678",
        senderFather: "Naim Wardak",
        senderIdNum: "NID-112233",
        senderIdImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image",
        receiverName: "Khan Shirin",
        receiverFather: "Khan Gul",
        receiverIdNum: "NID-998877",
        receiverPhone: "0788234567",
        receiverExpectedId: "NID-998877",
        receiverIdImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image",
        amount: 120000,
        currency: "AFN",
        fee: 300,
        status: "Paid Out",
        fundingSource: "sarafi"
      },
      {
        id: "HW-REC-003",
        type: "received",
        date: "2026-07-06",
        senderBranch: "Mazar Branch",
        destinationBranch: "Kabul Branch",
        senderName: "Naimatullah Khan",
        senderPhone: "0777123456",
        senderFather: "Karim Khan",
        senderIdNum: "NID-554433",
        senderIdImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image",
        receiverName: "Ahmad Wali",
        receiverFather: "Mohammad Wali",
        receiverIdNum: "NID-887766",
        receiverPhone: "0799123456",
        receiverExpectedId: "NID-887766",
        receiverIdImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sample+Image",
        amount: 5000,
        currency: "CNY",
        fee: 25,
        status: "Pending",
        fundingSource: "sarafi"
      }
    ];
    await Hawala.insertMany(hawalas);
    console.log("Seeded 6 Hawala records (3 Sent, 3 Received).");

    // 5. Seed Kahata Accounts (3 records)
    const kahatas = [
      {
        id: "KHT-001",
        name: "Haji Qayoum Sarafi",
        type: "Partner",
        phone: "0799888888",
        address: "Sarai Shahzada, Kabul",
        currency: "USD",
        netBalance: 12500,
        branch: "Kabul Branch",
        transactions: [
          {
            id: "TX-KHT-001",
            date: "2026-07-01",
            type: "Credit",
            amount: 15000,
            description: "Opening balance credit"
          },
          {
            id: "TX-KHT-002",
            date: "2026-07-03",
            type: "Debit",
            amount: 2500,
            description: "Hawala payout settlement"
          }
        ]
      },
      {
        id: "KHT-002",
        name: "Moustafa Habib Merchant",
        type: "Merchant",
        phone: "0788777777",
        address: "Chahar Rahi Sedarat, Kabul",
        currency: "AFN",
        netBalance: -45000,
        branch: "Kabul Branch",
        transactions: [
          {
            id: "TX-KHT-003",
            date: "2026-07-02",
            type: "Debit",
            amount: 50000,
            description: "Supplies procurement invoice debit"
          },
          {
            id: "TX-KHT-004",
            date: "2026-07-05",
            type: "Credit",
            amount: 5000,
            description: "Partial cash recovery credit"
          }
        ]
      },
      {
        id: "KHT-003",
        name: "Dubai Al-Ansari Exchange",
        type: "Partner",
        phone: "+97142222222",
        address: "Deira, Dubai, UAE",
        currency: "EUR",
        netBalance: 0,
        branch: "Dubai Branch",
        transactions: [
          {
            id: "TX-KHT-005",
            date: "2026-07-04",
            type: "Credit",
            amount: 10000,
            description: "Balance transfer credit"
          },
          {
            id: "TX-KHT-006",
            date: "2026-07-06",
            type: "Debit",
            amount: 10000,
            description: "Ledger clearance payout debit"
          }
        ]
      }
    ];
    await Kahata.insertMany(kahatas);
    console.log("Seeded 3 Kahata account records.");

    // 6. Seed Safe Transactions (3 records)
    const safeTransactions = [
      {
        id: "ST-001",
        date: "2026-07-01",
        type: "Credit",
        location: "Kabul Main Vault",
        amount: 100000,
        currency: "USD",
        description: "Initial operational cash capital deposit",
        recordedBy: "admin",
        branch: "Kabul Branch"
      },
      {
        id: "ST-002",
        date: "2026-07-02",
        type: "Debit",
        location: "Herat Branch Safe",
        amount: 250000,
        currency: "AFN",
        description: "Cash withdrawal for local branch expense reserve",
        recordedBy: "herat",
        branch: "Herat Main"
      },
      {
        id: "ST-003",
        date: "2026-07-03",
        type: "Credit",
        location: "Kabul Main Vault",
        amount: 8000,
        currency: "EUR",
        description: "Inbound capital foreign currency deposit",
        recordedBy: "kabul",
        branch: "Kabul Branch"
      }
    ];
    await SafeTransaction.insertMany(safeTransactions);
    console.log("Seeded 3 SafeTransaction records.");

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Seeding Error:", error);
  }
};

// Check if run directly from CLI
import { fileURLToPath } from "url";
import path from "path";
const nodePath = path.resolve(process.argv[1]);
const modulePath = fileURLToPath(import.meta.url);
if (nodePath === modulePath) {
  (async () => {
    try {
      console.log("Connecting to database for direct run...");
      await mongoose.connect(process.env.MONGODB_URI);
      await seedData();
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  })();
}
