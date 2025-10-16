import Errand from "../../../models/errand.js";
import { processItemImages } from "../../utils/processItemImages.js";
import { validateErrandData } from "../../utils/errandValidator.js";
import mongoose from "mongoose";
import Clan from "../../../models/clan.js";
import Wallet from "../../../models/wallet.js";
import TransactionHistory from "../../../models/TransactionHistory.js";
import User from "../../../models/user.js";
import FeatureFlag from "../../../models/FeatureFlag.js";

function validatePickupLocations(pickupLocations) {
  for (const [i, location] of pickupLocations.entries()) {
    if (!location.name?.trim() || !location.address?.trim()) {
      throw new Error(`Location ${i + 1} must have name and address`);
    }

    if (!Array.isArray(location.items) || location.items.length === 0) {
      throw new Error(
        `Location '${location.name}' must have at least one item`
      );
    }

    for (const [j, item] of location.items.entries()) {
      if (!item.name?.trim()) {
        throw new Error(
          `Item ${j + 1} at location '${location.name}' must have a name`
        );
      }

      const quantity = parseFloat(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(
          `Item '${item.name}' must have a valid positive quantity`
        );
      }

      const price = parseFloat(item.price);
      if (isNaN(price) || price < 0) {
        throw new Error(
          `Item '${item.name}' must have a valid non-negative price`
        );
      }
    }
  }
}

export const getAccessToFeatureFlag = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const clanData = req.clan;
    const { featureName } = req.query;

    const user = await User.findById(userId);
    // Validate input
    if (!featureName) {
      return res.status(400).json({ error: "featureName is required" });
    }

    // Find the feature flag
    const flag = await FeatureFlag.findOne({ name: featureName });
    if (!flag) {
      return res.json({
        allowed: false,
        reason: "Feature does not exist",
      });
    }

    // Case 1: Feature is public
    if (flag.isPublic) {
      return res.json({
        allowed: true,
        reason: "Feature is public",
      });
    }

    // // const { status, page = 1, limit = 10 } = req.query;
    // const query = { user: userId, clan: clanData._id };
    // const errands = await Errand.find(query)
    //   .populate("user", "name email")
    //   .populate("clan", "name")
    //   .populate("assignedTo", "name email")
    //   .sort({ createdAt: -1 })
    //   // .limit(limit * 1)
    //   // .skip((page - 1) * limit)
    //   .session(session);
    // const total = await Errand.countDocuments(query).session(session);
    // await session.commitTransaction();
    return res.status(200).json({
      success: true,
      user,
      clanData,
      //   errands,
      //   data: {
      //     errands,
      //     // pagination: {
      //     //   currentPage: page,
      //     //   totalPages: Math.ceil(total / limit),
      //     //   totalErrands: total,
      //     // },
      //   },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error getting user errands:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving errands",
    });
  } finally {
    session.endSession();
  }
};
