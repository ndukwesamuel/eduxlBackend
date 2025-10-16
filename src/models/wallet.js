import mongoose from "mongoose";
const { Schema } = mongoose; // Destructure Schema from mongoose

const WalletSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId, // Correct usage
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "NGN",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", WalletSchema);
