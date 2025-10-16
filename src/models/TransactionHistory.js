// --- TransactionHistory Schema and Model (as provided by you) ---

import mongoose from "mongoose";

const { Schema } = mongoose;

const TransactionHistorySchema = new Schema(
  // const TransactionHistorySchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "credit",
        "debit",
        "transfer",
        "purchase",
        "refund",
        "fee",
        "withdrawal",
        "deposit",
        "payment",
      ],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed", "cancelled", "reversed"],
      default: "pending",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: "NGN",
    },
    balanceAfter: {
      type: Number,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    transactionDate: {
      // This field stores the actual transaction time from Paystack
      type: Date,
      default: Date.now,
      required: true,
    },
    // `createdAt` and `updatedAt` are automatically managed by { timestamps: true }
    entityType: {
      type: String,
      enum: [
        "user",
        "bank_account",
        "payment_gateway",
        "vendor",
        "system",
        "event",
        "product",
        "staff_member",
        "errand",
      ],
    },
    paymentMethod: {
      type: String,
      trim: true,
      enum: [
        "card",
        "bank_transfer",
        "wallet",
        "cash",
        "paystack",
        "stripe",
        "other",
      ],
    },
    gatewayDetails: {
      gatewayTransactionId: { type: String, trim: true },
      gatewayResponseCode: { type: String, trim: true },
      gatewayResponseMessage: { type: String, trim: true },
      rawResponse: mongoose.Schema.Types.Mixed,
    },
    failureReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true } // Add timestamps option for createdAt and updatedAt
);

// // Indexes for common queries (uncommented for use)
// TransactionHistorySchema.index({ userId: 1, transactionDate: -1 }); // For fetching user's transactions by date
// TransactionHistorySchema.index({ transactionId: 1 }); // For quick lookup by transaction ID
// TransactionHistorySchema.index({ status: 1, type: 1 }); // For filtering by status and type
// // TransactionHistorySchema.index({ relatedEntity: 1 }); // If querying by related entities is common (Note: your schema removed relatedEntity as an object, so this index needs adjustment if you re-add it)

export default mongoose.model("TransactionHistory", TransactionHistorySchema);
