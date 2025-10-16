// emergencyReport.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const clanemergencyreport = new Schema(
  {
    clan: {
      type: Schema.Types.ObjectId,
      ref: "Clan",
      required: true,
    },
    member: {
      type: Schema.Types.ObjectId,
      ref: "User", // Assuming your user model is named "User"
      required: true,
    },
    type: {
      type: String,
      enum: ["fire", "health", "theft", "kidnapping", "burglary"],
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    additionalInfo: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("EmergencyReport", clanemergencyreport);
