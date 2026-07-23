import express from "express";
import multer from "multer";
import { Hawala } from "../models/Hawala.js";
import { checkAuth } from "../middleware/auth.js";
import { uploadFile } from "../utils/upload.js";
import { SafeTransaction } from "../models/SafeTransaction.js";
import { Kahata } from "../models/Kahata.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET all hawalas
router.get("/", checkAuth, async (req, res) => {
  try {
    const { search, type } = req.query;
    const userBranch = (req.dbUser && req.dbUser.branch) || "Kabul Branch";
    let query = {};
    const andConditions = [];

    // FIX 1: Normalize the type to lowercase to prevent case-sensitivity bugs
    // (e.g., if the frontend sends "?type=Sent", it won't fall into the else block)
    const queryType = type ? type.toLowerCase() : null;

    if (queryType === "sent") {
      // Only hawalas sent FROM this branch (includes check)
      andConditions.push({ 
        type: "sent", 
        senderBranch: { $regex: userBranch, $options: "i" } 
      });
    } else if (queryType === "received") {
      // Only hawalas whose destination is this branch
      andConditions.push({
        destinationBranch: userBranch,
        type: { $in: ["sent", "received"] },
      });

      // FIX 2 (Optional): If you want to hide Hawalas that have already been
      // processed/paid out from the active queue, uncomment the line below:
      // andConditions.push({ status: { $ne: "Paid Out" } });
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
      senderBranch: bodySenderBranch,
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
      skipVaultCredit,
    } = req.body;

    const userBranch = (req.dbUser && req.dbUser.branch) || "Kabul Branch";
    const shouldSkipVault = skipVaultCredit === "true" || skipVaultCredit === true;

    // Allow same-branch destination only for external hawalas (Kabul registering on behalf of another branch)
    if (destinationBranch === userBranch && !shouldSkipVault) {
      return res.status(400).json({ message: "A branch cannot send a Hawala to itself." });
    }

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
      senderBranch: bodySenderBranch || (req.dbUser && req.dbUser.branch) || "Kabul Branch",
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
      skipVaultCredit: shouldSkipVault,
      status: type === "sent" ? "Sent - Pending Payout" : "Pending",
    });

    await newHawala.save();

    // When a hawala is SENT from this branch, the customer pays cash (amount + fee).
    // Record both as Credits into the sending branch's Sarafi Vault.
    if (type === "sent" && !shouldSkipVault) {
      try {
        // Helper to get next SF- ID
        const getNextSfId = async () => {
          const latestSf = await SafeTransaction.findOne({ id: /^SF-/ }).sort({ id: -1 });
          let nextSfNum = 10001;
          if (latestSf && latestSf.id) {
            const parts = latestSf.id.split("-");
            const num = parseInt(parts[1], 10);
            if (!isNaN(num)) nextSfNum = num + 1;
          }
          return `SF-${nextSfNum}`;
        };

        const hawalaDate = newHawala.date || new Date().toISOString().split("T")[0];

        // 1) Credit the vault with the hawala amount (customer's cash)
        const txId1 = await getNextSfId();
        await new SafeTransaction({
          id: txId1,
          date: hawalaDate,
          type: "Credit",
          location: "Primary Vault (Safe)",
          amount: newHawala.amount,
          currency: newHawala.currency,
          description: `Hawala ${newHawala.id} received from ${newHawala.senderName} → ${newHawala.destinationBranch}`,
          recordedBy: req.dbUser.name || "System",
          branch: userBranch,
        }).save();
        console.log(`Vault Credit ${txId1}: ${newHawala.amount} ${newHawala.currency} for sent hawala ${newHawala.id}`);

        // 2) Credit the vault with the fee/commission (profit)
        if (newHawala.fee > 0) {
          const txId2 = await getNextSfId();
          await new SafeTransaction({
            id: txId2,
            date: hawalaDate,
            type: "Credit",
            location: "Primary Vault (Safe)",
            amount: newHawala.fee,
            currency: newHawala.currency,
            description: `Commission earned on Hawala ${newHawala.id} (${newHawala.senderName} → ${newHawala.destinationBranch})`,
            recordedBy: req.dbUser.name || "System",
            branch: userBranch,
          }).save();
          console.log(`Vault Credit ${txId2}: ${newHawala.fee} ${newHawala.currency} commission for sent hawala ${newHawala.id}`);
        }
      } catch (err) {
        console.error("Failed to record vault credits for sent hawala:", err);
      }
    }

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

    const userBranch = (req.dbUser && req.dbUser.branch) || "Kabul Branch";

    if (hawala.destinationBranch !== userBranch) {
      return res
        .status(403)
        .json({ message: "Access denied. Payouts must be processed by the destination branch." });
    }

    hawala.status = "Paid Out";
    if (req.body.receiverIdImageUrl) {
      hawala.receiverIdImageUrl = req.body.receiverIdImageUrl;
    }

    await hawala.save();

    // If funded from Sarafi cash safe (Khazana), reduce that money from Sarafi Vault when Paid Out
    if (hawala.fundingSource === "sarafi") {
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
          date: new Date().toISOString().split("T")[0],
          type: "Debit",
          location: "Primary Vault (Safe)",
          amount: hawala.amount,
          currency: hawala.currency,
          description: `Hawala ${hawala.id} paid to ${hawala.receiverName} (sent from ${hawala.senderBranch} by ${hawala.senderName})`,
          recordedBy: req.dbUser.name || "System",
          branch: userBranch,
        });
        await newTx.save();
        console.log(`Vault Debit ${txId}: ${hawala.amount} ${hawala.currency} for hawala payout ${hawala.id}`);
      } catch (err) {
        console.error("Failed to record vault debit for hawala payout:", err);
      }
    }

    // If funded from a Kahata account, deduct from that account and log a transaction
    if (hawala.fundingSource === "kahata" && hawala.kahataAccountId) {
      try {
        const kahataAccount = await Kahata.findOne({ id: hawala.kahataAccountId });
        if (kahataAccount) {
          const txnId = `TXN-${kahataAccount.transactions.length + 1}`;
          kahataAccount.transactions.push({
            id: txnId,
            date: new Date().toISOString().split("T")[0],
            type: "Debit",
            amount: hawala.amount,
            description: `Payout for Hawala ${hawala.id} - ${hawala.receiverName}`,
          });
          kahataAccount.netBalance -= hawala.amount;
          await kahataAccount.save();
          console.log(`Automatically logged Kahata transaction ${txnId} on account ${kahataAccount.id} for hawala payout ${hawala.id}`);
        } else {
          console.error(`Kahata account ${hawala.kahataAccountId} not found for hawala ${hawala.id}`);
        }
      } catch (err) {
        console.error("Failed to automatically record kahata transaction for payout:", err);
      }
    }

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

    const userBranch = (req.dbUser && req.dbUser.branch) || "Kabul Branch";

    if (
      hawala.senderBranch !== userBranch &&
      hawala.destinationBranch !== userBranch
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

    // If this was a SENT hawala, reverse the vault credits (amount + commission) that were created on send
    // Skip reversal for external hawalas (skipVaultCredit=true) since no credits were created
    if (hawala.type === "sent" && !hawala.skipVaultCredit) {
      try {
        // Delete the hawala amount credit
        await SafeTransaction.deleteMany({
          description: new RegExp(`Hawala ${hawala.id} received from`, "i")
        });
        // Delete the commission credit
        await SafeTransaction.deleteMany({
          description: new RegExp(`Commission earned on Hawala ${hawala.id}`, "i")
        });
        console.log(`Reversed vault credits for deleted sent hawala ${hawala.id}`);
      } catch (err) {
        console.error("Failed to reverse vault credits for deleted sent hawala:", err);
      }
    }

    // If this hawala was paid out and funded from Safe (Khazana), reverse the vault debit that was recorded at payout time
    if (hawala.status === "Paid Out" && hawala.fundingSource === "sarafi") {
      try {
        await SafeTransaction.deleteMany({
          description: new RegExp(`Hawala ${hawala.id} paid to`, "i")
        });
        console.log(`Reversed vault debit for deleted paid hawala ${hawala.id}`);
      } catch (err) {
        console.error("Failed to reverse vault debit for deleted hawala:", err);
      }
    }

    // If paid and funded from Kahata, remove the transaction from the kahata account and restore balance
    if (hawala.status === "Paid Out" && hawala.fundingSource === "kahata" && hawala.kahataAccountId) {
      try {
        const kahataAccount = await Kahata.findOne({ id: hawala.kahataAccountId });
        if (kahataAccount) {
          const txIndex = kahataAccount.transactions.findIndex(
            (tx) => tx.description && tx.description.includes(`Payout for Hawala ${hawala.id}`)
          );
          if (txIndex !== -1) {
            const removedTx = kahataAccount.transactions[txIndex];
            kahataAccount.transactions.splice(txIndex, 1);
            kahataAccount.netBalance += removedTx.amount;
            await kahataAccount.save();
            console.log(`Automatically reversed Kahata transaction for deleted hawala ${hawala.id}`);
          }
        }
      } catch (err) {
        console.error("Failed to automatically revert kahata transaction for deleted hawala:", err);
      }
    }

    await Hawala.deleteOne({ id: req.params.id });
    res.json({ message: `Hawala ${req.params.id} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
