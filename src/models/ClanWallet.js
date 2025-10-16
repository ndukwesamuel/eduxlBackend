import mongoose from "mongoose";
const { Schema } = mongoose;

const ClanWalletSchema = new Schema(
  {
    clan: {
      type: Schema.Types.ObjectId,
      ref: "Clan",
      required: true,
      unique: true, // One wallet per clan
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

export default mongoose.model("ClanWallet", ClanWalletSchema);
