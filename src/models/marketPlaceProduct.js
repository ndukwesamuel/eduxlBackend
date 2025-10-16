import mongoose from "mongoose";
const { Schema } = mongoose;
const { ObjectId } = Schema;

const MarketProductSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 160,
    },
    slug: {
      type: String,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Approve", "Decline"],
    },
    price: {
      type: Number,
      trim: true,
      required: true,
    },
    images: [
      {
        url: {
          type: String,
        },
        imagePublicId: {
          type: String,
        },
      },
    ],
    seller: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    clanId: {
      type: ObjectId,
      ref: "Clan",
      required: true,
    },
    contact: {
      type: String,
      default: "+23481334455",
    },
  },
  { timestamps: true }
);

export default mongoose.model("MarketProduct", MarketProductSchema);
