import mongoose, { Schema } from "mongoose";

const ResidentPaymentSchema = new Schema(
  {
    residentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },
    amountDue: { type: Number, required: true }, // kobo
    paidAt: { type: Date },
    paymentRef: String, // e.g. Paystack reference
  },
  { _id: false }
);

const LevySchema = new Schema(
  {
    estateId: { type: Schema.Types.ObjectId, ref: "Estate", required: true },
    title: { type: String, required: true },
    description: String,
    amount: { type: Number, required: true }, // NGN in kobo
    currency: { type: String, default: "NGN" },

    // period identifier e.g. "2025-08" for August 2025
    period: { type: String, required: true },

    // last date residents must pay
    dueDate: { type: Date, required: true },

    // all assigned residents with their payment status
    residents: [ResidentPaymentSchema],

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },

    status: { type: String, enum: ["active", "closed"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Levy", LevySchema);
