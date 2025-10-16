import Errand from "../../../models/errand.js";
import { processItemImages } from "../../utils/processItemImages.js";
import { validateErrandData } from "../../utils/errandValidator.js";
import mongoose from "mongoose";
import Clan from "../../../models/clan.js";
import Wallet from "../../../models/wallet.js";
import TransactionHistory from "../../../models/TransactionHistory.js";
import User from "../../../models/user.js";
import user from "../../../models/user.js";
import { hashPassword } from "../../../helpers/auth.js";
import { getRecipientsByEmails } from "../../../services/Userservice.js";

export const GetAllErand = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    // const clanData = req.clan;
    // const { status, page = 1, limit = 10 } = req.query;
    const query = { user: userId };
    //  clan: clanData._id };

    const errands = await Errand.find(query)
      .populate("user", "name email")
      // .populate("clan", "name")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 })
      // .limit(limit * 1)
      // .skip((page - 1) * limit)
      .session(session);

    const total = await Errand.countDocuments(query).session(session);

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      errands,
      data: {
        errands,
      },
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

export const createErrand = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      title,
      deliveryAddress,
      description,
      pickupLocations,
      phoneNumber,
    } = req.body;
    const userId = req.user._id;
    const clanData = req.clan;

    // Check if errands are allowed for the clan/estate
    if (!clanData?.settings?.allowErrand) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message:
          "Your Estate does not have the Errand feature enabled. Please reach out to the Admin.",
      });
    }

    // Validate basic fields
    if (!title?.trim() || !deliveryAddress?.trim()) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Title and delivery address are required",
      });
    }

    // Validate pickupLocations structure
    if (!Array.isArray(pickupLocations) || pickupLocations.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "At least one pickup location is required",
      });
    }

    // Validate clan exists
    const clan = await Clan.findById(clanData._id).session(session);
    if (!clan) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Clan not found",
      });
    }

    // Validate pickup locations and items
    try {
      validatePickupLocations(pickupLocations);
    } catch (validationError) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: validationError.message,
      });
    }

    // Calculate total order amount (price * quantity for all items)
    const totalAmount = pickupLocations.reduce((total, location) => {
      return (
        total +
        location.items.reduce((locTotal, item) => {
          return locTotal + item.price * item.quantity;
        }, 0)
      );
    }, 0);

    const maxOrderAmount = 20000; // 20,000 maximum total order amount

    if (totalAmount > maxOrderAmount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Total order amount cannot exceed ₦${maxOrderAmount.toLocaleString()}. Your total is ₦${totalAmount.toLocaleString()}`,
      });
    }

    // Create and save errand
    const newErrand = new Errand({
      title: title.trim(),
      deliveryAddress: deliveryAddress.trim(),
      description: description?.trim(),
      user: userId,
      clan: clan._id,
      pickupLocations,
      status: "pending",
      phoneNumber: phoneNumber,
    });

    const createdErrand = await newErrand.save({ session });
    await session.commitTransaction();

    const populatedErrand = await Errand.findById(createdErrand._id)
      .populate("user", "name email")
      .populate("clan", "name");
    const recipients = await getRecipientsByEmails();
    return res.status(201).json({
      success: true,
      data: populatedErrand,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error creating errand:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to create errand",
    });
  } finally {
    session.endSession();
  }
};

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

export const getErrandById = async (req, res) => {
  try {
    const { errandId } = req.params;

    const errand = await Errand.findById(errandId)
      .populate("resident", "name email")
      .populate("clan", "name")
      .populate("runner", "name email");

    if (!errand) {
      return res.status(404).json({
        success: false,
        message: "Errand not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: errand,
    });
  } catch (error) {
    console.error("Error getting errand:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving errand",
    });
  }
};

export const updateErrand = async (req, res) => {
  try {
    const { status, errandId } = req.body;
    const userId = req.user._id;

    // Only allow "assigned" status updates
    if (status !== "assigned") {
      return res.status(400).json({
        success: false,
        message:
          "Only 'assigned' status updates are allowed through this endpoint",
      });
    }

    const errand = await Errand.findOne({ _id: errandId }).populate("user");
    if (!errand) {
      return res.status(404).json({
        success: false,
        message: "Errand not found",
      });
    }

    // Only allow transition from "pending" to "assigned"
    if (errand.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Can only assign errands from pending status",
        currentStatus: errand.status,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found for free errand check",
      });
    }

    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(400).json({
        success: false,
        message: "User wallet not found",
      });
    }

    let walletBalanceInKobo = wallet.balance;
    let ErrandtotalPriceInKobo_minus_delevery = Math.round(
      errand.totalPrice * 100
    );
    let ErrandAmountInKobo = Math.round(errand.totalAmount * 100); // 53095 (Kobo)

    let walletUpdateResponse = null;

    // Handle free errands logic
    if (user.freeErrandsRemaining > 0) {
      // User has no free errands remaining, proceed with normal deduction
      if (walletBalanceInKobo < ErrandtotalPriceInKobo_minus_delevery) {
        return res.status(400).json({
          success: false,
          message: "Insufficient funds in wallet to assign this errand",
          requiredAmount: errand.totalAmount,
          currentBalance: wallet.balance,
        });
      }

      const initialBalance = walletBalanceInKobo;
      const deductionAmount = ErrandtotalPriceInKobo_minus_delevery;
      wallet.balance -= deductionAmount;
      await wallet.save();
      walletUpdateResponse = {
        initialBalance,
        deductionAmount,
        remainingBalance: wallet.balance,
        currency: "NGN",
        deductionDate: new Date(),
        message: `This was a free errand! You have ${user.freeErrandsRemaining} free errands remaining. No deduction from wallet.`,
      };
      // User has free errands available
      user.freeErrandsRemaining -= 1; // Decrement the count
      await user.save(); // Save the updated user document
    } else {
      // User has no free errands remaining, proceed with normal deduction
      if (walletBalanceInKobo < ErrandAmountInKobo) {
        return res.status(400).json({
          success: false,
          message: "Insufficient funds in wallet to assign this errand",
          requiredAmount: errand.totalAmount,
          currentBalance: wallet.balance,
        });
      }
      const initialBalance = walletBalanceInKobo;
      const deductionAmount = ErrandAmountInKobo;
      wallet.balance -= deductionAmount;
      await wallet.save();
      walletUpdateResponse = {
        initialBalance,
        deductionAmount,
        remainingBalance: wallet.balance,
        currency: "NGN",
        deductionDate: new Date(),
      };
    }

    // // Update errand status to assigned
    errand.status = "assigned";
    const updatedErrand = await errand.save();

    const recipients = await getRecipientsByEmails();

    return res.status(200).json({
      success: true,
      message: `Errand status updated from pending to assigned`,
      data: {
        errand: updatedErrand,
        wallet: walletUpdateResponse,
      },
      user: user.freeErrandsRemaining,
      wallet: walletBalanceInKobo,
      errand: ErrandAmountInKobo,
      ErrandtotalPriceInKobo_minus_delevery,
    });
  } catch (error) {
    console.error("Error updating errand:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update errand status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Cancel errand (residents only, before completion)
export const cancelErrand = async (req, res) => {
  try {
    const { errandId } = req.params;
    const userId = req.user._id;

    const errand = await Errand.findById(errandId);

    if (!errand) {
      return res.status(404).json({
        success: false,
        message: "Errand not found",
      });
    }

    if (errand.resident.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied - Not your errand",
      });
    }

    if (errand.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed errand",
      });
    }

    errand.status = "cancelled";
    await errand.save();

    return res.status(200).json({
      success: true,
      message: "Errand cancelled successfully",
      data: errand,
    });
  } catch (error) {
    console.error("Error cancelling errand:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while cancelling errand",
    });
  }
};

// Combined function to handle both cancel and complete operations
export const completed_canlcel_ErrandStatus = async (req, res) => {
  try {
    const { status, errandId } = req.body;
    const userId = req.user._id;

    // Only allow "cancelled" or "completed" status updates
    const validStatuses = ["cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Only 'cancelled' or 'completed' status updates are allowed",
        allowedStatuses: validStatuses,
      });
    }

    const errand = await Errand.findOne({ _id: errandId }).populate("user");
    if (!errand) {
      return res.status(404).json({
        success: false,
        message: "Errand not found",
      });
    }

    // Handle cancellation logic
    if (status === "cancelled") {
      // Only allow cancellation from "pending" status
      if (errand.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Can only cancel errands from pending status",
          currentStatus: errand.status,
        });
      }

      // Update errand status to cancelled
      errand.status = "cancelled";
      errand.cancelledAt = new Date();
    }

    // Handle completion logic
    if (status === "completed") {
      // Only allow completion from "delivered" status
      if (errand.status !== "delivered") {
        return res.status(400).json({
          success: false,
          message: "Can only complete errands that are delivered",
          currentStatus: errand.status,
        });
      }

      // Only the errand creator can mark as completed
      if (errand.user._id.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Only the errand creator can mark as completed",
        });
      }

      // Update errand status to completed
      errand.status = "completed";
      errand.completedAt = new Date();
    }

    const updatedErrand = await errand.save();

    return res.status(200).json({
      success: true,
      message: `Errand ${status} successfully`,
      data: {
        errand: updatedErrand,
        wallet: {
          message: `No wallet transaction occurred for ${status}.`,
        },
      },
    });
  } catch (error) {
    console.error(`Error updating errand status to ${status}:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to update errand status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
