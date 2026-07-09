import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema(
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
    categoryId: {
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
    },
    description: String,
    recordedBy: {
      type: String,
      required: true,
    },
    receiptUrl: String,
  },
  { timestamps: true }
);

export const Expense = mongoose.model("Expense", ExpenseSchema);
