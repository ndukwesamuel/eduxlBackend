import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
        "Please provide a valid email",
      ],
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
      max: 64,
      // select: false
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVendor: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    roles: {
      type: [String],
      default: ["user"],
    },
    tokens: {
      type: String,
    },
    clans: [
      {
        type: Schema.Types.ObjectId,
        ref: "Clan",
      },
    ],
    freeErrandsRemaining: {
      type: Number,
      default: 1, // Default to 1 free errand for new users. Change this to 3, 5, etc. as needed.
      min: 0,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
