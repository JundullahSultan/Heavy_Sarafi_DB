import express from "express";
import { Exchange } from "../models/Exchange.js";
import { SafeTransaction } from "../models/SafeTransaction.js";
import { checkAuth } from "../middleware/auth.js";

const router = express.Router();

// GET all exchanges (filtered by branch)
router.get("/", checkAuth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (req.dbUser.role !== "owner") {
      query.branch = req.dbUser.branch;
    }

    if (search) {
      query.$or = [
        { id: { $regex: search, $options: "i" } },
        { clientName: { $regex: search, $options: "i" } },
        { fromCurrency: { $regex: search, $options: "i" } },
        { toCurrency: { $regex: search, $options: "i" } },
      ];
    }


    const exchanges = await Exchange.find(query).sort({ date: -1, createdAt: -1 });
    res.json(exchanges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST record new exchange
router.post("/", checkAuth, async (req, res) => {
  try {
    const { date, clientName, fromCurrency, fromAmount, toCurrency, toAmount, rate, benefit, benefitCurrency } = req.body;

    if (!fromCurrency || !fromAmount || !toCurrency || !toAmount || !rate) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    const count = await Exchange.countDocuments();
    const exchangeId = `EXG-${10001 + count}`;
    const userBranch = req.dbUser.branch || "Kabul Branch";

    const newExchange = new Exchange({
      id: exchangeId,
      date: date || new Date().toISOString().split("T")[0],
      clientName: clientName || "Walk-in Client",
      fromCurrency,
      fromAmount: parseFloat(fromAmount),
      toCurrency,
      toAmount: parseFloat(toAmount),
      rate: parseFloat(rate),
      benefit: parseFloat(benefit) || 0,
      benefitCurrency: benefitCurrency || toCurrency,
      recordedBy: req.dbUser.name,
      branch: userBranch,
    });

    await newExchange.save();

    // Log vault entries
    try {
      // Helper to generate unique SF transaction ID
      const getNextSfId = async () => {
        const latest = await SafeTransaction.findOne({ id: /^SF-/ }).sort({ id: -1 });
        let nextNum = 10001;
        if (latest && latest.id) {
          const parts = latest.id.split("-");
          const num = parseInt(parts[1], 10);
          if (!isNaN(num)) {
            nextNum = num + 1;
          }
        }
        return `SF-${nextNum}`;
      };

      const txDate = newExchange.date;

      // 1. Debit the sold/delivered currency from primary vault
      const txId1 = await getNextSfId();
      await new SafeTransaction({
        id: txId1,
        date: txDate,
        type: "Debit",
        location: "Primary Vault (Safe)",
        amount: newExchange.fromAmount,
        currency: newExchange.fromCurrency,
        description: `Currency Exchange ${newExchange.id}: Delivered ${newExchange.fromAmount} ${newExchange.fromCurrency} for ${newExchange.toCurrency}`,
        recordedBy: req.dbUser.name,
        branch: userBranch,
      }).save();

      // 2. Credit the bought/received currency into primary vault
      const txId2 = await getNextSfId();
      await new SafeTransaction({
        id: txId2,
        date: txDate,
        type: "Credit",
        location: "Primary Vault (Safe)",
        amount: newExchange.toAmount,
        currency: newExchange.toCurrency,
        description: `Currency Exchange ${newExchange.id}: Received ${newExchange.toAmount} ${newExchange.toCurrency} for ${newExchange.fromCurrency}`,
        recordedBy: req.dbUser.name,
        branch: userBranch,
      }).save();

      console.log(`Log vault entries for exchange: Debit ${newExchange.fromCurrency}, Credit ${newExchange.toCurrency}`);
    } catch (err) {
      console.error("Failed to automatically record vault safe transactions for currency exchange:", err);
    }

    res.status(201).json(newExchange);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE exchange
router.delete("/:id", checkAuth, async (req, res) => {
  try {
    const exchange = await Exchange.findOne({ id: req.params.id });
    if (!exchange) {
      return res.status(404).json({ message: "Exchange record not found." });
    }

    if (req.dbUser.role !== "owner" && exchange.branch !== req.dbUser.branch) {
      return res.status(403).json({ message: "Access denied. Exchange belongs to another branch." });
    }

    // Delete corresponding safe transactions
    try {
      await SafeTransaction.deleteMany({
        description: new RegExp(`Currency Exchange ${exchange.id}`, "i")
      });
      console.log(`Reversed vault safe transactions corresponding to exchange ${exchange.id}`);
    } catch (err) {
      console.error("Failed to automatically revert vault transactions for deleted exchange:", err);
    }

    await Exchange.deleteOne({ id: req.params.id });
    res.json({ message: "Exchange record deleted successfully.", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
