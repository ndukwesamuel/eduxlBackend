// import User from "../models/user.js";
// import UserProfile from "../models/profile.js";
// import { hashPassword, comparePassword } from "../helpers/auth.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { validationResult } from "express-validator";
import {
  findUserByEmail,
  validatePassword,
} from "../../services/Userservice.js";
import clan from "../../models/clan.js";
import User from "../../models/user.js";
import { comparePassword, hashPassword } from "../../helpers/auth.js";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import mongoose from "mongoose";
import UserProfile from "../../models/profile.js";
import wallet from "../../models/wallet.js";
import emailUtils from "../../helpers/emailUtils.js";

dotenv.config();

export const esatetAdminlogin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await findUserByEmail(email);

    const match = await validatePassword(password, user.password);

    if (!user.isVerified) {
      return res.status(401).json({ message: "Email Not Verified" });
    }

    // Find all clans where the user is an admin with access level 1 to 3
    const clans = await clan.find({
      "admins.user": user._id,
      "admins.level": { $gte: 1, $lte: 3 }, // Access level between 1 and 3
    });

    if (clans.length === 0) {
      return res
        .status(403)
        .json({ error: "Access denied. User is not an admin in any estate." });
    }

    // Prepare estate details for the response
    const estateDetails = clans.map((clan) => ({
      id: clan._id,
      name: clan.name,
      accessLevel: clan.admins.find(
        (admin) => admin.user.toString() === user._id.toString()
      ).level,
    }));

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, estates: estateDetails },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Token expires in 7 days
    );

    // Omit sensitive data from the response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      estates: clans, // Include estates where the user is an admin
    };

    res.status(200).json({
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

// import Clan from "../models/clan.js"; // Adjust the path to your Clan model

export const getAllEstatesForAdmin = async (req, res) => {
  try {
    const userId = req.user._id; // Get the user ID from the authenticated request

    // // Find all clans where the user is an admin with access level 1 to 3
    const clans = await clan.find({
      "admins.user": userId,
      "admins.level": { $gte: 1, $lte: 3 }, // Access level between 1 and 3
    });

    if (clans.length === 0) {
      return res
        .status(404)
        .json({ message: "No estates found for this admin." });
    }

    // Send response
    res.status(200).json({
      message: "Estates retrieved successfully",
      estates: clans, // estateDetails,
    });
  } catch (err) {
    console.error("Error fetching estates:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const HappyLandUpdate = async (req, res) => {
  try {
    const { address, email, password, clanId } = req.body;

    // Input validation
    if (!address || !email || !password || !clanId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Wrong password or email" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: "Email Not Verified" });
    }

    // Update member's address in the clan
    const updatedClan = await clan.findOneAndUpdate(
      {
        _id: clanId,
        "members.user": user._id,
      },
      {
        $set: {
          "members.$.homeAddress": address,
        },
      },
      { new: true }
    );

    if (!updatedClan) {
      return res.status(404).json({
        message: "Clan not found or user is not a member of this clan",
      });
    }

    // Find the updated member info to return
    const updatedMember = updatedClan.members.find(
      (member) => member.user.toString() === user._id.toString()
    );

    res.status(200).json({
      message: "Address updated successfully",
      updatedAddress: updatedMember.homeAddress,
      clanId: updatedClan._id,
    });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const FakeHappyLandUpdate = async (req, res) => {
  try {
    const { address, email, password, clanId } = req.body;

    // Input validation
    if (!address || !email || !password || !clanId) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Wrong password or email" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: "Email Not Verified" });
    }

    // Update member's address in the clan
    const updatedClan = await clan.findOneAndUpdate(
      {
        _id: clanId,
        "members.user": user._id,
      },
      {
        $set: {
          "members.$.homeAddress": address,
        },
      },
      { new: true }
    );

    if (!updatedClan) {
      return res.status(404).json({
        message: "Clan not found or user is not a member of this clan",
      });
    }

    // Find the updated member info to return
    const updatedMember = updatedClan.members.find(
      (member) => member.user.toString() === user._id.toString()
    );

    res.status(200).json({
      message: "Address updated successfully",
      updatedAddress: updatedMember.homeAddress,
      clanId: updatedClan._id,
    });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const Register = asyncWrapper(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name) return res.status(400).json({ error: "Name is required" });
  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!password || password.length < 6) {
    return res.status(400).json({
      error: "Password must be at least 6 characters long",
    });
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: "Email is taken" });
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Start transaction to ensure all operations succeed or fail together
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create user
    const user = await User.create(
      [
        {
          name,
          email,
          password: hashedPassword,
          isGuest: true,
          isVerified: true,
        },
      ],
      { session }
    );

    // Create user profile
    await UserProfile.create(
      [
        {
          user: user[0]._id,
        },
      ],
      { session }
    );

    // Create wallet for the user
    await wallet.create(
      [
        {
          user: user[0]._id,
          balance: 0,
          currency: "NGN",
        },
      ],
      { session }
    );

    // Send OTP email
    // const emailInfo = await emailUtils.sendOTPByEmail(email, name);

    // Commit transaction if all operations succeed
    await session.commitTransaction();

    res.status(201).json({
      message: `Welcome to PausePoint`,
      // `OTP has been sent to ${emailInfo.envelope.to}`,
      userId: user,
    });
  } catch (error) {
    // Abort transaction if any operation fails
    await session.abortTransaction();
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  } finally {
    session.endSession();
  }
});
