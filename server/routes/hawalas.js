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
    let query = {};
    
    const isOwner = req.dbUser.role === "owner";
    const andConditions = [];

    if (type === "sent") {
      andConditions.push({ type: "sent" });
      if (!isOwner) {
        andConditions.push({ senderBranch: req.dbUser.branch });
      }
    } else if (type === "received") {
      if (!isOwner) {
        andConditions.push({ destinationBranch: req.dbUser.branch });
      } else {
        andConditions.push({
          $or: [
            { type: "received" },
            { destinationBranch: { $exists: true } }
          ]
        });
      }
    } else {
      if (!isOwner) {
        andConditions.push({
          $or: [
            { senderBranch: req.dbUser.branch },
            { destinationBranch: req.dbUser.branch }
          ]
        });
      }
    }
    
    if (search) {
      andConditions.push({
        $or: [
          { id: { $regex: search, $options: "i" } },
          { senderName: { $regex: search, $options: "i" } },
          { receiverName: { $regex: search, $options: "i" } },
        ]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }
    
    // Auto-populate initial data if empty
    await Hawala.deleteMany({ id: { $in: ["HW-9021", "HW-9022", "SHW-5011"] } });
    const count = await Hawala.countDocuments();
    if (count === 0) {
      await Hawala.insertMany([
        {
          id: "HW-9021",
          type: "received",
          date: "2026-06-28",
          senderBranch: "Herat Main",
          destinationBranch: "Kabul Branch",
          senderName: "Farooq",
          senderPhone: "0799123456",
          receiverName: "Ahmad Khan",
          receiverFather: "Mahmoud",
          receiverIdNum: "1401-233-4902",
          amount: 50000,
          currency: "AFN",
          status: "Pending",
          receiverIdImageUrl: "https://placehold.co/1000x600/e2e8f0/64748b?text=High+Res+Tazkira+Image"
        },
        {
          id: "HW-9022",
          type: "received",
          date: "2026-06-28",
          senderBranch: "Mazar Branch",
          destinationBranch: "Kabul Branch",
          senderName: "Wali",
          senderPhone: "0700987654",
          receiverName: "Zalmay",
          receiverFather: "Tariq",
          receiverIdNum: "P-9921834",
          amount: 1200,
          currency: "USD",
          status: "Pending",
          receiverIdImageUrl: "https://placehold.co/1000x600/e2e8f0/64748b?text=High+Res+Passport+Image"
        },
        {
          id: "SHW-5011",
          type: "sent",
          date: "2026-06-29 09:00 AM",
          senderBranch: "Kabul Branch",
          destinationBranch: "Herat Main",
          senderName: "Omar",
          senderFather: "Hassan",
          senderPhone: "0771112222",
          senderIdNum: "1401-999-1111",
          senderIdImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Sender+Tazkira",
          receiverName: "Farooq",
          receiverFather: "Jalal",
          receiverPhone: "0799123456",
          receiverExpectedId: "P-1234567",
          receiverIdImageUrl: "https://placehold.co/600x400/e2e8f0/64748b?text=Receiver+Tazkira",
          amount: 15000,
          currency: "AFN",
          fee: 150,
          status: "Sent - Pending Payout"
        }
      ]);
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
      kahataAccountId
    } = req.body;

    let receiverIdImageUrl = "";

    if (req.file) {
      receiverIdImageUrl = await uploadFile(
        req.file.buffer,
        "heavy_sarafi_hawalas",
        req.file.originalname
      );
    }

    const prefix = type === "sent" ? "SHW" : "HW";
    const latest = await Hawala.findOne({ type, id: new RegExp(`^${prefix}-`) }).sort({ id: -1 });

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
      receiverName,
      receiverFather,
      receiverPhone,
      receiverExpectedId,
      receiverIdImageUrl, // set the uploaded image URL
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
    
    if (req.dbUser.role !== "owner" && hawala.destinationBranch !== req.dbUser.branch) {
      return res.status(403).json({ message: "Access denied. Payouts must be processed by the destination branch." });
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

    if (req.dbUser.role !== "owner" && hawala.senderBranch !== req.dbUser.branch && hawala.destinationBranch !== req.dbUser.branch) {
      return res.status(403).json({ message: "Access denied. Hawala belongs to another branch." });
    }

    // Role checking
    const userRole = req.dbUser.role;
    if (userRole === "employee") {
      // Employees can only delete within 15 minutes of creation
      const standardizedDateStr = hawala.date.replace(/-/g, "/");
      const creationTime = new Date(standardizedDateStr).getTime();
      const currentTime = new Date().getTime();
      const diffInMinutes = (currentTime - creationTime) / (1000 * 60);

      if (diffInMinutes < 0 || diffInMinutes > 15) {
        return res.status(403).json({ message: "Action outside standard 15-minute deletion window." });
      }
    }

    await Hawala.deleteOne({ id: req.params.id });
    res.json({ message: `Hawala ${req.params.id} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
