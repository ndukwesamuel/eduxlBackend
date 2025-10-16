import User from "../../../models/user.js";
import UserProfile from "../../../models/profile.js";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import RunnerProfile from "../../../models/runner.js";
import Errand from "../../../models/errand.js";

export const addRunner = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, phoneNumber, address, clanId } = req.body;

    if (!name || !email) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const defaultPassword = "123456789";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      roles: ["runner"],
      isVerified: true,
      isActive: true,
    });

    const savedUser = await newUser.save({ session });

    const userProfile = new RunnerProfile({
      user: savedUser._id,
      clan: clanId,
    });

    await userProfile.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Runner added successfully to estate",
      data: {
        defaultPassword: defaultPassword,
        loginInstructions: "Runner should change password after first login",
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error adding runner:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while adding runner",
    });
  }
};

export const getEstateRunners = async (req, res) => {
  try {
    // --- Fetch ALL Runner Profiles ---
    const runners = await RunnerProfile.find({}) // No filter applied here, so it gets all
      .populate("user", "-password -tokens -clans") // Populate user details, excluding sensitive info and redundant 'clans' array
      .populate("clan", "name uniqueClanID email address phonenumber") // Populate clan details, selecting relevant fields
      .populate({
        path: "errands", // Correctly populate the 'errands' array
        select:
          "title status deliveryAddress totalPrice serviceCharge totalAmount createdAt", // Select specific fields from each errand
        populate: [
          // Nested populate to get user and clan details within each errand
          {
            path: "user",
            select: "name email", // Select name and email of the errand creator
          },
          {
            path: "clan",
            select: "name uniqueClanID", // Select name and unique ID of the errand's clan
          },
        ],
      })
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    res.status(200).json({
      success: true,
      count: runners.length, // Add count for convenience
      data: runners,
    });
  } catch (error) {
    console.error("Error getting all runners:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving runners.",
      error: error.message, // Include error message for debugging purposes (consider removing in production)
    });
  }
};

export const getAllErrands = async (req, res) => {
  try {
    const errands = await Errand.find()
      .populate("user", "name email") // Populate 'user' field, selecting only 'name' and 'email'
      .populate("clan"); // Populate 'clan' field, selecting 'name' and 'uniqueClanID'
    // .populate("assignedTo", "name email") // Populate 'assignedTo' field (if assigned runner is a User model)
    // .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      success: true,
      count: errands.length,
      errands,
    });
  } catch (error) {
    console.error("Error getting all runners:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving runners.",
      error: error.message, // Include error message for debugging purposes (consider removing in production)
    });
  }
};

export const deactivateRunner = async (req, res) => {
  try {
    const { runnerId, clanId } = req.body;

    if (!runnerId || !clanId) {
      return res.status(400).json({
        success: false,
        message: "runnerId and clanId are required in the body",
      });
    }

    const runner = await User.findOne({
      _id: runnerId,
      clans: clanId,
      roles: { $in: ["runner"] },
    });

    if (!runner) {
      return res.status(404).json({
        success: false,
        message: "Runner not found in this estate",
      });
    }

    const updatedRunner = await User.findByIdAndUpdate(
      runnerId,
      {
        isActive: false,
        $pull: { roles: "runner" },
      },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Runner deactivated successfully",
      data: {
        runner: updatedRunner,
      },
    });
  } catch (error) {
    console.error("Error deactivating runner:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deactivating runner",
    });
  }
};
