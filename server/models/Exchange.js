import mongoose from "mongoose";

const ExchangeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      default: "",
    },
    fromCurrency: {
      type: String,
      required: true,
    },
    fromAmount: {
      type: Number,
      required: true,
    },
    toCurrency: {
      type: String,
      required: true,
    },
    toAmount: {
      type: Number,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
    },
    benefit: {
      type: Number,
      required: true,
      default: 0,
    },
    benefitCurrency: {
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

export const Exchange = mongoose.model("Exchange", ExchangeSchema);
