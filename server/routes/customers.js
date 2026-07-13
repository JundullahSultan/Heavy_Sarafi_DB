import express from "express";
import multer from "multer";
import { Customer } from "../models/Customer.js";
import { checkAuth } from "../middleware/auth.js";
import { uploadFile } from "../utils/upload.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET all customers (supports search query)
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
        { idNumber: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { id: { $regex: search, $options: "i" } },
      ];
    }
    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST register new customer
router.post("/", checkAuth, upload.single("idImage"), async (req, res) => {
  try {
    const { name, fatherName, phone, idNumber, address } = req.body;
    let idImageUrl = "https://placehold.co/600x400/e2e8f0/64748b?text=Default+ID+Scan";

    if (req.file) {
      idImageUrl = await uploadFile(
        req.file.buffer,
        "heavy_sarafi_customers",
        req.file.originalname
      );
    }

    // Generate unique Customer ID CUST-XXXX using suffix increment
    const latest = await Customer.findOne({ id: /^CUST-/ }).sort({ id: -1 });
    let nextNum = 1001;
    if (latest && latest.id) {
      const parts = latest.id.split("-");
      const num = parseInt(parts[1], 10);
      if (!isNaN(num)) {
        nextNum = num + 1;
      }
    }
    const customerId = `CUST-${nextNum}`;

    const newCustomer = new Customer({
      id: customerId,
      name,
      fatherName,
      phone,
      idNumber,
      address,
      idImageUrl,
      branch: req.dbUser.branch || "Kabul Branch",
    });

    await newCustomer.save();
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// PUT update customer
router.put("/:id", checkAuth, upload.single("idImage"), async (req, res) => {
  try {
    const customer = await Customer.findOne({ id: req.params.id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    if (req.dbUser.role !== "owner" && customer.branch !== req.dbUser.branch) {
      return res.status(403).json({ message: "Access denied. Customer belongs to another branch." });
    }

    const { name, fatherName, phone, idNumber, address } = req.body;
    if (name) customer.name = name;
    if (fatherName) customer.fatherName = fatherName;
    if (phone) customer.phone = phone;
    if (idNumber) customer.idNumber = idNumber;
    if (address) customer.address = address;

    if (req.file) {
      customer.idImageUrl = await uploadFile(
        req.file.buffer,
        "heavy_sarafi_customers",
        req.file.originalname
      );
    }

    await customer.save();
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE customer
router.delete("/:id", checkAuth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ id: req.params.id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    if (req.dbUser.role !== "owner" && customer.branch !== req.dbUser.branch) {
      return res.status(403).json({ message: "Access denied. Customer belongs to another branch." });
    }

    await Customer.deleteOne({ id: req.params.id });
    res.json({ message: "Customer deleted.", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
