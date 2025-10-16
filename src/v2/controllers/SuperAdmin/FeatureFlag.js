// import FeatureFlag from "../models/FeatureFlag.js";

import FeatureFlag from "../../../models/FeatureFlag.js";

// Create a new feature flag
export const createFeatureFlag = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: "Feature name is required" });
    }

    // Check for existing feature with same name
    const existingFlag = await FeatureFlag.findOne({ name });
    if (existingFlag) {
      return res.status(400).json({ error: "Feature name must be unique" });
    }

    // Validate companies array structure if provided
    if (companies && Array.isArray(companies)) {
      for (const company of companies) {
        if (!company.estate) {
          return res.status(400).json({
            error: "Each company must have an estate ID",
          });
        }

        // Validate userExceptions if provided
        if (company.userExceptions) {
          for (const user of company.userExceptions) {
            if (!user.email && !user.userId) {
              return res.status(400).json({
                error: "User exceptions must have either email or userId",
              });
            }
            if (typeof user.allowed !== "boolean") {
              return res.status(400).json({
                error: "User allowed status must be boolean",
              });
            }
          }
        }
      }
    }

    // Create the new feature flag
    const newFlag = await FeatureFlag.create({
      name,
      isPublic: isPublic || false,
      companies: companies || [],
    });

    res.status(201).json({
      message: "Feature flag created successfully",
      featureFlag: newFlag,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to create feature flag",
      details: err.message,
    });
  }
};

export const GetAllFeatureFlag = async (req, res) => {
  try {
    const data = await FeatureFlag.find();
    res.status(201).json({
      message: "Feature flag created successfully",
      featureFlag: data,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to create feature flag",
      details: err.message,
    });
  }
};

// Get all feature flags (with optional filters)

// Keep your existing checkFeatureAccess implementation
export const checkFeatureAccess = async (req, res) => {
  // ... (your existing implementation)
};
