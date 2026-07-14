import express from "express";
import multer from "multer";
import { Hawala } from "../models/Hawala.js";
import { checkAuth } from "../middleware/auth.js";
import { uploadFile } from "../utils/upload.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET all hawalas
router.get("/", checkAuth, async (req, res) => {
  try {
    const { search, type } = req.query;
    const userBranch = req.dbUser.branch;
    let query = {};
    const andConditions = [];

    if (type === "sent") {
      // Only hawalas sent FROM this branch
      andConditions.push({ type: "sent", senderBranch: userBranch });
    } else if (type === "received") {
      // Only hawalas whose destination is this branch
      // FIX: merged into a single object so both conditions are enforced together
      andConditions.push({
        destinationBranch: userBranch,
        type: { $in: ["sent", "received"] },
      });
    } else {
      // General / Reports view: show only hawalas that involve this branch
      andConditions.push({
        $or: [
          { senderBranch: userBranch },
          { destinationBranch: userBranch },
        ],
      });
    }

    if (search) {
      andConditions.push({
        $or: [
          { id: { $regex: search, $options: "i" } },
          { senderName: { $regex: search, $options: "i" } },
          { receiverName: { $regex: search, $options: "i" } },
        ],
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const hawalas = await Hawala.find(query).sort({ createdAt: -1 });
    res.json(hawalas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create a hawala
router.post("/", checkAuth, upload.single("receiverIdImage"), async (req, res) => {
  try {
    const {
      type,
      date,
      destinationBranch,
      senderName,
      senderFather,
      senderPhone,
      senderIdNum,
      receiverName,
      receiverFather,
      receiverPhone,
      receiverExpectedId,
      amount,
      currency,
      fee,
      fundingSource,
      kahataAccountId,
    } = req.body;

    let senderIdImageUrl = "";
    let receiverIdImageUrl = "";

    if (req.file) {
      receiverIdImageUrl = await uploadFile(
        req.file.buffer,
        "heavy_sarafi_hawalas",
        req.file.originalname
      );
    }

    const prefix = type === "sent" ? "SHW" : "HW";
    const latest = await Hawala.findOne({
      type,
      id: new RegExp(`^${prefix}-`),
    }).sort({ id: -1 });

    let nextNum = type === "sent" ? 5012 : 9023;
    if (latest && latest.id) {
      const parts = latest.id.split("-");
      const num = parseInt(parts[1], 10);
      if (!isNaN(num)) {
        nextNum = num + 1;
      }
    }

    const hawalaId = `${prefix}-${nextNum}`;

    const newHawala = new Hawala({
      id: hawalaId,
      type,
      date: date || new Date().toLocaleString(),
      senderBranch: (req.dbUser && req.dbUser.branch) || "Kabul Branch",
      destinationBranch,
      senderName,
      senderFather,
      senderPhone,
      senderIdNum,
      senderIdImageUrl,
      receiverName,
      receiverFather,
      receiverPhone,
      receiverExpectedId,
      receiverIdImageUrl,
      amount: parseFloat(amount),
      currency,
      fee: parseFloat(fee) || 0,
      fundingSource,
      kahataAccountId: kahataAccountId || undefined,
      status: type === "sent" ? "Sent - Pending Payout" : "Pending",
    });

    await newHawala.save();
    res.status(201).json(newHawala);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT payout verification
router.put("/:id/payout", checkAuth, async (req, res) => {
  try {
    const hawala = await Hawala.findOne({ id: req.params.id });
    if (!hawala) {
      return res.status(404).json({ message: "Hawala not found." });
    }

    if (hawala.destinationBranch !== req.dbUser.branch) {
      return res
        .status(403)
        .json({ message: "Access denied. Payouts must be processed by the destination branch." });
    }

    hawala.status = "Paid Out";
    if (req.body.receiverIdImageUrl) {
      hawala.receiverIdImageUrl = req.body.receiverIdImageUrl;
    }

    await hawala.save();
    res.json(hawala);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE a hawala
router.delete("/:id", checkAuth, async (req, res) => {
  try {
    const hawala = await Hawala.findOne({ id: req.params.id });
    if (!hawala) {
      return res.status(404).json({ message: "Hawala not found." });
    }

    if (
      hawala.senderBranch !== req.dbUser.branch &&
      hawala.destinationBranch !== req.dbUser.branch
    ) {
      return res
        .status(403)
        .json({ message: "Access denied. Hawala belongs to another branch." });
    }

    const userRole = req.dbUser.role;
    if (userRole === "employee") {
      const standardizedDateStr = hawala.date.replace(/-/g, "/");
      const creationTime = new Date(standardizedDateStr).getTime();
      const currentTime = new Date().getTime();
      const diffInMinutes = (currentTime - creationTime) / (1000 * 60);

      if (diffInMinutes < 0 || diffInMinutes > 15) {
        return res
          .status(403)
          .json({ message: "Action outside standard 15-minute deletion window." });
      }
    }

    await Hawala.deleteOne({ id: req.params.id });
    res.json({ message: `Hawala ${req.params.id} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
