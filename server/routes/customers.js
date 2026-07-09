import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Customer } from "../models/Customer.js";
import { checkAuth } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  console.log("Cloudinary configured successfully for Customer uploads.");
} else {
  console.warn("Cloudinary credentials missing. Uploaded images will use default placeholders.");
}

// GET all customers (supports search query)
router.get("/", checkAuth, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { idNumber: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { id: { $regex: search, $options: "i" } },
        ],
      };
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
      if (isCloudinaryConfigured) {
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: "heavy_sarafi_customers" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });
        idImageUrl = uploadResult.secure_url;
      } else {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const fileExt = req.file.originalname.split(".").pop();
        const fileName = `customer-id-${uniqueSuffix}.${fileExt}`;
        const filePath = path.join(__dirname, "../uploads", fileName);
        
        fs.writeFileSync(filePath, req.file.buffer);
        idImageUrl = `http://localhost:5000/uploads/${fileName}`;
        console.log("Customer ID image saved locally: ", idImageUrl);
      }
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

    const { name, fatherName, phone, idNumber, address } = req.body;
    if (name) customer.name = name;
    if (fatherName) customer.fatherName = fatherName;
    if (phone) customer.phone = phone;
    if (idNumber) customer.idNumber = idNumber;
    if (address) customer.address = address;

    if (req.file && isCloudinaryConfigured) {
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "heavy_sarafi_customers" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
      customer.idImageUrl = uploadResult.secure_url;
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
    const customer = await Customer.findOneAndDelete({ id: req.params.id });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }
    res.json({ message: "Customer deleted.", id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
