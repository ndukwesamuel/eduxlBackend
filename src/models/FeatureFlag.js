import mongoose from "mongoose";
const { Schema } = mongoose;

// 1. User Permission Sub-Schema (for individual overrides)
const userPermissionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User" }, // Optional if using email
  email: { type: String, lowercase: true }, // Alternative to userId
  allowed: { type: Boolean, required: true },
});

// 2. Company Permission Sub-Schema
const companyPermissionSchema = new Schema({
  estate: { type: Schema.Types.ObjectId, ref: "Clan", required: true },
  allowed: { type: Boolean, default: false },
  // Optional: Allow exceptions for specific users in the company
  userExceptions: [userPermissionSchema],
});

// 3. Main Feature Flag Schema
const featureFlagSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    isPublic: { type: Boolean, default: false }, // Global toggle
    // Tiered access control
    companies: [companyPermissionSchema], // Company-level access
    // individualUsers: [userPermissionSchema] // Direct user grants (outside companies)
  },
  { timestamps: true }
);

export default mongoose.model("FeatureFlag", featureFlagSchema);
