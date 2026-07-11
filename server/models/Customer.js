import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    fatherName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    idNumber: {
      type: String,
      required: true,
    },
    address: { type: String, required: true },
    idImageUrl: { type: String, required: true },
    branch: { type: String, required: true },
    registeredDate: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
  },
  { timestamps: true }
);

export const Customer = mongoose.model("Customer", CustomerSchema);
