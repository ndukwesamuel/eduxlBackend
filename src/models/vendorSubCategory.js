import mongoose from "mongoose";
const { Schema } = mongoose;
const { ObjectId } = Schema;

const vendorSubCategorySchema = new Schema(
  {
    category: {
      type: ObjectId,
      ref: "VendorCategory",
      required: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
      maxLength: 32,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("VendorSubCategory", vendorSubCategorySchema);
