import mongoose from "mongoose";
const { Schema } = mongoose;

const visitorInvitationSchema = new Schema(
  {
    clan: {
      type: Schema.Types.ObjectId,
      ref: "Clan",
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    access_code: {
      type: String,
      required: true,
      unique: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    visitor_name: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
    },
    phone_number: {
      type: Number,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    location: {
      type: String,
    },
    // Ensure status field is properly defined
    status: {
      type: String,
      enum: ["pending", "arrived", "departed"],
      default: "pending",
    },
    // Make sure timestamp fields are explicitly defined
    arrived_at: {
      type: Date,
      default: null,
    },
    departed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Add a virtual getter for serializing to JSON
visitorInvitationSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    // Ensure timestamps are included
    ret.arrived_at = doc.arrived_at;
    ret.departed_at = doc.departed_at;
    return ret;
  },
});

export default mongoose.model("VisitorInvitation", visitorInvitationSchema);
