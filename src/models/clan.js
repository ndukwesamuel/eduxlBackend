// clan.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const clanSettingsSchema = new Schema({
  allowUsersToManageRequests: { type: Boolean, default: false },
  allowMembersToEditProfile: { type: Boolean, default: false },
  allowSelfApproval: { type: Boolean, default: false },
  allowErrand: { type: Boolean, default: false },
  // Add more flags based on what features you want configurable
});

const clanSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      unique: true,
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
      // unique: true,
    },

    address: {
      type: String,
    },
    phonenumber: {
      type: String,
    },

    admins: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        level: {
          type: Number,
          enum: [1, 2, 3, 4, 5],
          default: 1,
        },
      },
    ],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected", "suspended"],
          default: "pending",
        },
        homeAddress: {
          type: String,
          default: "",
        },
        phonenumber: {
          type: String,
        },
        houseNumber: {
          type: String,
          default: "",
        },
        street: {
          type: String,
          default: "",
        },
        apartmentType: {
          type: String,
          default: "",
        },
        unitNumber: {
          type: String,

          default: "",
        },
        memberCode: {
          type: String,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    uniqueClanID: {
      type: String,
      unique: true,
    },

    // NEW FIELDS: Arrays to store clan-specific streets and apartment types
    availableStreets: {
      type: [String], // Array of strings
      default: [], // Default to an empty array
    },
    availableApartmentTypes: {
      type: [String], // Array of strings
      default: [], // Default to an empty array
    },

    settings: clanSettingsSchema, // 👈 added this
  },
  { timestamps: true }
);

// generate unique ID for clan
clanSchema.pre("save", function (next) {
  const now = new Date();
  const monthYear = `${now.getMonth() + 1}-${now.getFullYear()}`;
  const nameFirstChars = this.name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("");
  this.uniqueClanID = `${nameFirstChars}-${monthYear}`;
  next();
});

export default mongoose.model("Clan", clanSchema);
