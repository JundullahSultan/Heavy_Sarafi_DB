import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Expense } from "../models/Expense.js";
import { checkAuth } from "../middleware/auth.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Configure Cloudinary Helper
let isCloudinaryConfigured = false;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  isCloudinaryConfigured = true;
  console.log("Cloudinary configured successfully for Expense uploads.");
}

// GET all expenses
router.get("/", checkAuth, async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (category && category !== "all") {
      query.categoryId = category;
    }

    if (search) {
      query.$or = [
        { id: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Auto-populate initial data if empty
    const count = await Expense.countDocuments();
    if (count === 0) {
      await Expense.insertMany([
        {
          id: "EXP-1001",
          date: "2026-07-01",
          categoryId: "rent-utilities",
          amount: 45000,
          currency: "AFN",
          description: "Office rent for July 2026",
          recordedBy: "Manager",
        },
        {
          id: "EXP-1002",
          date: "2026-07-01",
          categoryId: "rent-utilities",
          amount: 3500,
          currency: "AFN",
          description: "Electricity bill",
          recordedBy: "Manager",
        },
        {
          id: "EXP-1003",
          date: "2026-07-02",
          categoryId: "staff",
          amount: 1200,
          currency: "AFN",
          description: "Tea and refreshments",
          recordedBy: "Employee",
        }
      ]);
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

    if (req.file && isCloudinaryConfigured) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "heavy_sarafi_expenses" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
      receiptUrl = uploadResult.secure_url;
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
      receiptUrl,
    });

    await newExpense.save();
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

    const { date, categoryId, amount, currency, description } = req.body;
    if (date) expense.date = date;
    if (categoryId) expense.categoryId = categoryId;
    if (amount) expense.amount = parseFloat(amount);
    if (currency) expense.currency = currency;
    if (description) expense.description = description;

    if (req.file && isCloudinaryConfigured) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "heavy_sarafi_expenses" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
      expense.receiptUrl = uploadResult.secure_url;
    }

    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE expense
router.delete("/:id", checkAuth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ id: req.params.id });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }
    res.json({ message: "Expense deleted.", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
