import mongoose from "mongoose";

const SafeTransactionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: String,
      required: true,
      default: () => new Date().toISOString().split("T")[0],
    },
    type: {
      type: String,
      enum: ["Credit", "Debit"],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      enum: ["AFN", "USD", "PKR", "EUR", "CNY", "IRR", "GBP"],
    },
    description: {
      type: String,
      required: true,
    },
    recordedBy: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const SafeTransaction = mongoose.model(
  "SafeTransaction",
  SafeTransactionSchema
);
