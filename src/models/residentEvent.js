import mongoose from "mongoose";

const { Schema } = mongoose;

const residentEventSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clan",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    guestNumber: {
      type: Number,
    },
    isAdmin: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ResidentEvent", residentEventSchema);
