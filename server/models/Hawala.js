import mongoose from "mongoose";

const HawalaSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["received", "sent"],
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    // Sender Information
    senderBranch: {
      type: String,
      required: true,
    },
    destinationBranch: {
      type: String,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderPhone: String,
    senderFather: String,
    senderIdNum: String,
    senderIdImageUrl: String,
    // Receiver Information
    receiverName: {
      type: String,
      required: true,
    },
    receiverFather: String,
    receiverIdNum: String,
    receiverPhone: String,
    receiverExpectedId: String,
    receiverIdImageUrl: String,
    // Financials
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    fee: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Paid Out", "Sent - Pending Payout"],
    },
    fundingSource: {
      type: String,
      enum: ["sarafi", "kahata"],
      default: "sarafi",
    },
    kahataAccountId: String,
    skipVaultCredit: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Hawala = mongoose.model("Hawala", HawalaSchema);
