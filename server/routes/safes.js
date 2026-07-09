import express from "express";
import { SafeTransaction } from "../models/SafeTransaction.js";
import { checkAuth } from "../middleware/auth.js";

const router = express.Router();

// GET all transactions (filtered by current user's branch)
router.get("/", checkAuth, async (req, res) => {
  try {
    const userBranch = req.dbUser.branch || "Kabul Branch";
    const { location, currency, search } = req.query;
    
    // Always scope to the user's branch
    let query = { branch: userBranch };

    if (location && location !== "all") {
      query.location = location;
    }
    if (currency && currency !== "all") {
      query.currency = currency;
    }
    if (search) {
      query.description = { $regex: search, $options: "i" };
    }

    // Auto-populate initial records for this branch if none exist
    const count = await SafeTransaction.countDocuments({ branch: userBranch });
    if (count === 0) {
      await SafeTransaction.insertMany([
        {
          id: `SF-${userBranch.replace(/\s+/g, "")}-1001`,
          date: "2026-07-01",
          type: "Credit",
          location: "Primary Vault (Safe)",
          amount: 2500000,
          currency: "AFN",
          description: `Initial opening balance for ${userBranch}`,
          recordedBy: "System",
          branch: userBranch,
        },
        {
          id: `SF-${userBranch.replace(/\s+/g, "")}-1002`,
          date: "2026-07-02",
          type: "Debit",
          location: "Primary Vault (Safe)",
          amount: 150000,
          currency: "AFN",
          description: "Replenished Operator Cash Drawer",
          recordedBy: "System",
          branch: userBranch,
        },
        {
          id: `SF-${userBranch.replace(/\s+/g, "")}-1003`,
          date: "2026-07-02",
          type: "Credit",
          location: "Operator Cash Drawer (Till)",
          amount: 150000,
          currency: "AFN",
          description: "Received from Primary Vault replenishment",
          recordedBy: "System",
          branch: userBranch,
        },
      ]);
    }

    const transactions = await SafeTransaction.find(query).sort({ date: -1, createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET balances grouped by location and currency (filtered by user's branch)
router.get("/balances", checkAuth, async (req, res) => {
  try {
    const userBranch = req.dbUser.branch || "Kabul Branch";
    const transactions = await SafeTransaction.find({ branch: userBranch });
    
    const balances = {};

    transactions.forEach((tx) => {
      const key = `${tx.location}_${tx.currency}`;
      if (!balances[key]) {
        balances[key] = {
          location: tx.location,
          currency: tx.currency,
          balance: 0,
        };
      }
      if (tx.type === "Credit") {
        balances[key].balance += tx.amount;
      } else {
        balances[key].balance -= tx.amount;
      }
    });

    res.json(Object.values(balances));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create safe transaction (scoped to user's branch)
router.post("/", checkAuth, async (req, res) => {
  try {
    const userBranch = req.dbUser.branch || "Kabul Branch";
    const { date, type, location, amount, currency, description } = req.body;

    if (!type || !location || !amount || !currency || !description) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const latest = await SafeTransaction.findOne({ id: /^SF-/ }).sort({ id: -1 });
    let nextNum = 1001;
    if (latest && latest.id) {
      const parts = latest.id.split("-");
      const num = parseInt(parts[1], 10);
      if (!isNaN(num)) {
        nextNum = num + 1;
      }
    }
    const id = `SF-${nextNum}`;

    const newTx = new SafeTransaction({
      id,
      date: date || new Date().toISOString().split("T")[0],
      type,
      location,
      amount: parseFloat(amount),
      currency,
      description,
      recordedBy: req.dbUser.name,
      branch: userBranch, // force set the user's active branch
    });

    await newTx.save();
    res.status(201).json(newTx);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE transaction (safeguarded by user's branch check)
router.delete("/:id", checkAuth, async (req, res) => {
  try {
    const userBranch = req.dbUser.branch || "Kabul Branch";
    const deleted = await SafeTransaction.findOneAndDelete({
      id: req.params.id,
      branch: userBranch, // enforce branch matching
    });
    
    if (!deleted) {
      return res.status(404).json({ message: "Transaction not found or unauthorized deletion." });
    }
    res.json({ message: "Transaction deleted.", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
