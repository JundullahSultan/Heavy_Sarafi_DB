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


    const accounts = await Kahata.find(query).sort({ name: 1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create account
router.post("/", checkAuth, async (req, res) => {
  try {
    const { name, type, phone, whatsapp, address, currency, initialBalance } = req.body;
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
      whatsapp,
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
