import express from "express";
import multer from "multer";
import { Expense } from "../models/Expense.js";
import { checkAuth } from "../middleware/auth.js";
import { uploadFile } from "../utils/upload.js";
import { SafeTransaction } from "../models/SafeTransaction.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET all expenses
router.get("/", checkAuth, async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (req.dbUser.role !== "owner") {
      query.branch = req.dbUser.branch;
    }

    if (category && category !== "all") {
      query.categoryId = category;
    }

    if (search) {
      query.$or = [
        { id: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }


    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST record new expense
router.post("/", checkAuth, upload.single("receipt"), async (req, res) => {
  try {
    const { date, categoryId, amount, currency, description } = req.body;
    let receiptUrl = null;

    if (req.file) {
      receiptUrl = await uploadFile(
        req.file.buffer,
        "heavy_sarafi_expenses",
        req.file.originalname
      );
    }

    const count = await Expense.countDocuments();
    const expenseId = `EXP-${1009 + count}`;

    const newExpense = new Expense({
      id: expenseId,
      date: date || new Date().toISOString().split("T")[0],
      categoryId,
      amount: parseFloat(amount),
      currency,
      description,
      recordedBy: req.dbUser.name,
      branch: req.dbUser.branch || "Kabul Branch",
      receiptUrl,
    });

    await newExpense.save();

    // Log the expense as a debit (payout) transaction in the Safe
    try {
      const latest = await SafeTransaction.findOne({ id: /^SF-/ }).sort({ id: -1 });
      let nextNum = 10001;
      if (latest && latest.id) {
        const parts = latest.id.split("-");
        const num = parseInt(parts[1], 10);
        if (!isNaN(num)) {
          nextNum = num + 1;
        }
      }
      const txId = `SF-${nextNum}`;

      const newTx = new SafeTransaction({
        id: txId,
        date: newExpense.date,
        type: "Debit",
        location: "Primary Vault (Safe)",
        amount: newExpense.amount,
        currency: newExpense.currency,
        description: `Expense: ${newExpense.id} - ${newExpense.description || "No description"}`,
        recordedBy: newExpense.recordedBy || "System",
        branch: newExpense.branch,
      });
      await newTx.save();
      console.log(`Automatically logged SafeTransaction ${txId} for expense ${newExpense.id}`);
    } catch (err) {
      console.error("Failed to automatically record safe transaction for expense:", err);
    }

    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update expense
router.put("/:id", checkAuth, upload.single("receipt"), async (req, res) => {
  try {
    const expense = await Expense.findOne({ id: req.params.id });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    if (req.dbUser.role !== "owner" && expense.branch !== req.dbUser.branch) {
      return res.status(403).json({ message: "Access denied. Expense belongs to another branch." });
    }

    const { date, categoryId, amount, currency, description } = req.body;
    if (date) expense.date = date;
    if (categoryId) expense.categoryId = categoryId;
    if (amount) expense.amount = parseFloat(amount);
    if (currency) expense.currency = currency;
    if (description) expense.description = description;

    if (req.file) {
      expense.receiptUrl = await uploadFile(
        req.file.buffer,
        "heavy_sarafi_expenses",
        req.file.originalname
      );
    }

    await expense.save();

    // Update corresponding safe transaction
    try {
      await SafeTransaction.findOneAndUpdate(
        { description: new RegExp(`Expense: ${expense.id}`, "i") },
        {
          date: expense.date,
          amount: expense.amount,
          currency: expense.currency,
          description: `Expense: ${expense.id} - ${expense.description || "No description"}`,
          branch: expense.branch,
        }
      );
      console.log(`Automatically updated SafeTransaction corresponding to expense ${expense.id}`);
    } catch (err) {
      console.error("Failed to automatically update safe transaction for expense:", err);
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE expense
router.delete("/:id", checkAuth, async (req, res) => {
  try {
    const expense = await Expense.findOne({ id: req.params.id });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }

    if (req.dbUser.role !== "owner" && expense.branch !== req.dbUser.branch) {
      return res.status(403).json({ message: "Access denied. Expense belongs to another branch." });
    }

    // Delete the corresponding safe transaction to restore the money back to the vault
    try {
      await SafeTransaction.deleteMany({
        description: new RegExp(`Expense: ${expense.id}`, "i")
      });
      console.log(`Automatically deleted SafeTransaction corresponding to expense ${expense.id}`);
    } catch (err) {
      console.error("Failed to automatically delete safe transaction for expense:", err);
    }

    await Expense.deleteOne({ id: req.params.id });
    res.json({ message: "Expense deleted.", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
