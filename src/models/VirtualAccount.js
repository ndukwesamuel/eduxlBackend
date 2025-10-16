import mongoose from "mongoose";
const { Schema } = mongoose;

const virtualAccountSchema = new Schema(
  {
    // Link this virtual account back to a User
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // A user should only have ONE virtual account
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

    phoneNumber: {
      type: String,
      default: "",
    },

    // The unique identifier/reference from the payment gateway
    providerReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    accountName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
      unique: true, // Account numbers should be globally unique
    },
    bankName: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: "NGN",
      //   enum: ["NGN", "USD"], // Limit to supported currencies
    },
  },
  { timestamps: true }
);

export default mongoose.model("VirtualAccount", virtualAccountSchema);
