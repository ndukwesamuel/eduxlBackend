// BuyTransaction.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const buyTransactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true, // An errand must be associated with a user
    },
    // Reference to the Clan this errand belongs to
    clan: {
      type: Schema.Types.ObjectId,
      ref: "Clan",
      // required: false, // An errand must belong to a clan
    },

    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerAddress: { type: String },
    customerPhone: { type: String },
    meterId: { type: String, required: true },
    meterType: { type: String },
    totalPaid: { type: Number, required: true }, // Original amount paid
    vat: { type: Number, default: 0 }, // VAT applied
    serviceFee: { type: Number, default: 0 }, // Service fee (1%)
    totalAmount: { type: Number, required: true }, // totalPaid + vat + serviceFee
    totalUnit: { type: Number, required: true },
    unit: { type: String, default: "kWh" },
    pricePerUnit: { type: Number, required: true }, // base price per unit
    priceUnitCurrency: { type: String, default: "Naira" },
    priceCategories: { type: String }, // optional
    rate: { type: Number, default: 0 }, // optional
    token: { type: String, required: true },
    genTime: { type: Date, default: Date.now },
    isVendByUnit: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Calculate service fee & total before saving
// buyTransactionSchema.pre("save", function (next) {
//   // Example: serviceFee = 1% of totalPaid
//   this.serviceFee = this.totalPaid * 0.01;

//   // If VAT is not provided, assume 0 (or calculate if needed)
//   // this.vat = some calculation if required

//   // Total amount = totalPaid + VAT + serviceFee
//   this.totalAmount = this.totalPaid + this.vat + this.serviceFee;

//   next();
// });

export default mongoose.model("BuyTransaction", buyTransactionSchema);
