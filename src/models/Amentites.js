import mongoose from "mongoose";

const AmentitesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    payment: {
      type: String,
      lowercase: true,
    },
    clan: { type: mongoose.Schema.Types.ObjectId, ref: "Clan" },
  },
  { timestamps: true }
);

export default mongoose.model("Amentites", AmentitesSchema);
