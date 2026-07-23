import mongoose from "mongoose";

const KahataTransactionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Credit", "Debit"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: String,
  },
  { timestamps: true }
);

const KahataSchema = new mongoose.Schema(
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
    type: {
      type: String,
      required: true, // Merchant vs Partner Sarafi
    },
    phone: String,
    whatsapp: String,
    address: String,
    currency: {
      type: String,
      required: true,
    },
    netBalance: {
      type: Number,
      default: 0,
    },
    branch: {
      type: String,
      required: true,
    },
    transactions: [KahataTransactionSchema],
  },
  { timestamps: true }
);

export const Kahata = mongoose.model("Kahata", KahataSchema);
