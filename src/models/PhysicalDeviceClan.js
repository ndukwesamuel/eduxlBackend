// physicalDeviceClan.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const physicalDeviceClanSchema = new Schema(
  {
    clan: {
      type: Schema.Types.ObjectId,
      ref: "Clan",
      required: true,
      unique: true,
    },
    estateCode: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PhysicalDeviceClan", physicalDeviceClanSchema);
