// rate.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const rateSchema = new Schema(
  {
    clan: {
      type: Schema.Types.ObjectId,
      ref: "Clan",
      required: true,
      unique: true, // One wallet per clan
    },
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Prevent duplicate rate names
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Rate", rateSchema);
