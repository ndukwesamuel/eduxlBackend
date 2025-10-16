// import Clan from "../models/clan.js";
import Clan from "../../../models/clan.js";
import UserProfile from "../../../models/profile.js";
// import { hashPassword } from "../utils/auth.js"; // Adjust the path to your password hashing utility

import User from "../../../models/user.js";
import slugify from "slugify";
import {
  FindClanByEmail,
  FindClanService,
} from "../../../services/clanService.js";
import { findUserByEmail } from "../../../services/Userservice.js";
import { customError } from "../../../utils/customError.js";
import asyncWrapper from "../../../middlewares/asyncWrapper.js";
import { hashPassword, comparePassword } from "../../../helpers/auth.js";

import mongoose from "mongoose";
import clan from "../../../models/clan.js";
import ClanWallet from "../../../models/ClanWallet.js";
import PhysicalDeviceClan from "../../../models/PhysicalDeviceClan.js";
import { sendGPassCode } from "../../../services/deviceService.js";

export const registerAndCreateClan = async (req, res) => {
  const session = await mongoose.startSession(); // Start a new session
  session.startTransaction(); // Start a transaction

  try {
    const { name, email, clanName, clanAddress, clanPhone } = req.body;

    let password = "123456789";
    // Validate required fields for user registration
    if (!name || !email || !password || password.length < 6) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        error: "Name, email, and password (at least 6 characters) are required",
      });
    }

    // Validate required fields for clan creation
    const requiredClanFields = ["clanName", "clanAddress", "clanPhone"];
    const missingClanFields = requiredClanFields.filter(
      (field) => !req.body[field]
    );

    if (missingClanFields.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        error: "Missing required clan fields: " + missingClanFields.join(", "),
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Email is already taken" });
    }

    // Check if clan with the same email already exists
    const existingClan = await Clan.findOne({ email }).session(session);
    if (existingClan) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ error: "Clan already exists with this email" });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user within the transaction
    const user = await User.create(
      [
        {
          name,
          email,
          password: hashedPassword,
          isVerified: true,
        },
      ],
      { session }
    );

    // Create the user profile within the transaction (if needed)
    const userProfile = await UserProfile.create(
      [
        {
          user: user[0]._id,
        },
      ],
      { session }
    );

    // Create the clan within the transaction
    const clan = await Clan.create(
      [
        {
          name: clanName,
          email,
          address: clanAddress,
          phonenumber: clanPhone,
          status: "approved",
          creator: user[0]._id, // Set the creator to the newly registered user
          admins: [
            {
              user: user[0]._id,
              level: 1, // Assuming level 5 is the highest admin level
            },
          ],
          members: [
            {
              user: user[0]._id,
              status: "approved", // Automatically approve the creator
            },
          ],
        },
      ],
      { session }
    );

    // Commit the transaction if everything is successful
    await session.commitTransaction();
    session.endSession();

    // Send OTP to the user's email (outside the transaction)
    // const emailInfo = await sendOTPByEmail(email, name);

    // Return success response
    return res.status(201).json({
      success: true,
      // message: `OTP has been sent to ${emailInfo.envelope.to}`,
      user: user[0],
      clan: clan[0],
    });
  } catch (error) {
    // Abort the transaction in case of any error
    await session.abortTransaction();
    session.endSession();

    console.error("Error in registerAndCreateClan:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
