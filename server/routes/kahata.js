import express from "express";
import { Kahata } from "../models/Kahata.js";
import { checkAuth } from "../middleware/auth.js";

const router = express.Router();

// GET all accounts
router.get("/", checkAuth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (req.dbUser.role !== "owner") {
      query.branch = req.dbUser.branch;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { id: { $regex: search, $options: "i" } },
      ];
    }

    // Auto-populate mock accounts if collection is empty
    const count = await Kahata.countDocuments();
    if (count === 0) {
      await Kahata.insertMany([
        {
          id: "KHT-8001",
          name: "Haji Abdul Rahman",
          type: "Partner Sarafi (Another Branch/City)",
          phone: "0799112233",
          address: "Kandahar Market",
          currency: "AFN",
          netBalance: 250000,
          branch: "Kabul Branch",
          transactions: [
            {
              id: "TXN-1",
              date: "2026-06-25",
              type: "Credit",
              amount: 300000,
              description: "Initial Deposit / Opening Balance",
            },
            {
              id: "TXN-2",
              date: "2026-06-27",
              type: "Debit",
              amount: 50000,
              description: "Settlement for SHW-5011",
            },
          ],
        },
        {
          id: "KHT-8002",
          name: "Zamani Electronics",
          type: "Merchant / Regular Customer",
          phone: "0700445566",
          address: "Kabul, District 2",
          currency: "USD",
          netBalance: -1500,
          branch: "Kabul Branch",
          transactions: [
            {
              id: "TXN-3",
              date: "2026-06-10",
              type: "Credit",
              amount: 5000,
              description: "Cash Deposit",
            },
            {
              id: "TXN-4",
              date: "2026-06-15",
              type: "Debit",
              amount: 6500,
              description: "Sent Hawala to Dubai",
            },
          ],
        }
      ]);
    }

    const accounts = await Kahata.find(query).sort({ name: 1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create account
router.post("/", checkAuth, async (req, res) => {
  try {
    const { name, type, phone, address, currency, initialBalance } = req.body;
    const count = await Kahata.countDocuments();
    const accountId = `KHT-${8003 + count}`;

    const parsedBalance = parseFloat(initialBalance) || 0;
    
    const transactions = [];
    if (parsedBalance !== 0) {
      transactions.push({
        id: "TXN-1",
        date: new Date().toISOString().split("T")[0],
        type: parsedBalance > 0 ? "Credit" : "Debit",
        amount: Math.abs(parsedBalance),
        description: "Opening Balance Adjustment",
      });
    }

    const newAccount = new Kahata({
      id: accountId,
      name,
      type,
      phone,
      address,
      currency,
      netBalance: parsedBalance,
      branch: req.dbUser.branch || "Kabul Branch",
      transactions,
    });

    await newAccount.save();
    res.status(201).json(newAccount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET single account details
router.get("/:id", checkAuth, async (req, res) => {
  try {
    const account = await Kahata.findOne({ id: req.params.id });
    if (!account) {
      return res.status(404).json({ message: "Kahata account not found." });
    }

    if (req.dbUser.role !== "owner" && account.branch !== req.dbUser.branch) {
      return res.status(403).json({ message: "Access denied. Account belongs to another branch." });
    }

    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST log transaction to ledger
router.post("/:id/transaction", checkAuth, async (req, res) => {
  try {
    const { type, amount, description, date } = req.body;
    const account = await Kahata.findOne({ id: req.params.id });
    
    if (!account) {
      return res.status(404).json({ message: "Kahata account not found." });
    }

    if (req.dbUser.role !== "owner" && account.branch !== req.dbUser.branch) {
      return res.status(403).json({ message: "Access denied. Account belongs to another branch." });
    }

    const parsedAmount = parseFloat(amount);
    const txnId = `TXN-${account.transactions.length + 1}`;

    const newTxn = {
      id: txnId,
      date: date || new Date().toISOString().split("T")[0],
      type,
      amount: parsedAmount,
      description,
    };

    account.transactions.push(newTxn);

    // Update netBalance (Credit adds funds, Debit deducts)
    if (type === "Credit") {
      account.netBalance += parsedAmount;
    } else {
      account.netBalance -= parsedAmount;
    }

    await account.save();
    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE account
router.delete("/:id", checkAuth, async (req, res) => {
  try {
    const account = await Kahata.findOne({ id: req.params.id });
    if (!account) {
      return res.status(404).json({ message: "Kahata account not found." });
    }
    
    if (req.dbUser.role !== "owner" && account.branch !== req.dbUser.branch) {
      return res.status(403).json({ message: "Access denied. Account belongs to another branch." });
    }

    await Kahata.deleteOne({ id: req.params.id });
    res.json({ message: `Account ${req.params.id} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
