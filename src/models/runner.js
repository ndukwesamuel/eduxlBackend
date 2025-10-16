import mongoose from "mongoose";

const RunnerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    clan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clan", // This references the estate they’re assigned to
      // required: true,
    },

    clansData: [
      {
        clan: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Clan",
          required: true,
        },
        status: {
          type: String,
          enum: ["active", "inactive", "pending"],
          default: "active",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    phoneNumber: {
      type: String,
      default: "",
    },
    errands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Errand",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const RunnerProfile = mongoose.model("RunnerProfile", RunnerProfileSchema);

export default RunnerProfile;
