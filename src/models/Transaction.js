import mongoose from "mongoose";
const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    // Link to the User who owns this transaction
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // For faster lookup by user
    },

    // The unique transaction ID provided by the payment gateway (from webhook data.reference)
    reference: {
      type: String,
      required: true,
      unique: true, // Crucial for preventing duplicate credits (idempotency)
      trim: true,
    },

    // Amount of the transaction (stored in Naira, since the webhook conversion happens in the controller)
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // The currency of the transaction
    currency: {
      type: String,
      required: true,
      //   enum: ["NGN", "USD"], // Limit to supported currencies
      default: "NGN",
    },

    // Type of transaction (e.g., credit for funding, debit for spending)
    type: {
      type: String,
      required: true,
      enum: ["credit", "debit", "reversal"],
    },

    // Status of the transaction
    status: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed", "reversed"],
      default: "pending",
    },

    // Detailed description/narration from the webhook or source
    details: {
      type: String,
      trim: true,
    },

    // Optional: Keep the bank details for auditing
    // sourceBank: {
    //   accountName: { type: String },
    //   accountNumber: { type: String },
    //   bankCode: { type: String },
    // },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

// Create an index for quick lookups by reference, ensuring quick idempotency checks
transactionSchema.index({ reference: 1 });

export default mongoose.model("Transaction", transactionSchema);
