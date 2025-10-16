import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { validationResult } from "express-validator";
import {
  findUserByEmail,
  validatePassword,
} from "../../services/Userservice.js";
import Clan from "../../models/clan.js";
import user from "../../models/user.js";
import User from "../../models/user.js";
import csvParser from "csv-parser";
import fs from "fs";
import mongoose from "mongoose";
import { hashPassword } from "../../helpers/auth.js";
import { generateNextMemberCode } from "./SuperAdmin/clan.js";
import UserProfile from "../../models/profile.js";
import Wallet from "../../models/wallet.js";

// export const this_was_to_create_estate_test2 = async (req, res) => {
//   try {
//     const hashedPassword = await hashPassword("123456789");

//     const updatedUser = await user.findOneAndUpdate(
//       { email: "captainscourtestate1@gmail.com" }, // Query to find the user by email
//       {
//         $set: {
//           password: hashedPassword,
//           isVerified: true,
//           name: "captains court estate",
//         },
//       }, // Update the password
//       { new: true } // Return the updated document
//     );
//     if (!updatedUser) {
//       throw new Error("User not found with the provided email");
//     }
//     res.status(200).json({
//       message: "Login successful",
//       updatedUser,
//       //   token,
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ error: err.message });
//   }
// };

// import csvParser from 'csv-parser';
// import fs from 'fs';
// import mongoose from 'mongoose';
// import { generateNextMemberCode } from './memberCodeGenerator'; // Import your member code generator

// export const registerTestUsers = async (req, res) => {
//   const { clanId, users } = req.body; // Expects array of { name, email }
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Validate input
//     if (!users || !Array.isArray(users)) {
//       return res.status(400).json({ error: "Users array is required" });
//     }

//     const processedUsers = [];
//     const MAX_BATCH_SIZE = 20;
//     let currentBatch = [];

//     const clan = await Clan.findById(clanId).session(session);
//     if (!clan) throw new Error("Clan not found");

//     for (const [index, userData] of users.entries()) {
//       const { name, email } = userData;

//       // Skip if missing critical fields
//       if (!name || !email) {
//         console.warn(`Skipping entry ${index} - missing name or email`);
//         continue;
//       }

//       // Check for existing user
//       const existingUser = await User.findOne({ email }).session(session);
//       let userId;

//       if (existingUser) {
//         userId = existingUser._id;
//       } else {
//         const hashedPassword = await hashPassword("123456789");

//         // Create new user (password is optional since we're focusing on name/email)
//         const [user] = await User.create(
//           [{ name, email, isVerified: true, password: hashedPassword }],
//           {
//             session,
//           }
//         );
//         userId = user._id;
//       }

//       // Generate member code (assuming this is still needed)
//       const memberCode = await generateNextMemberCode(clanId);

//       currentBatch.push({
//         user: userId,
//         status: "approved",
//         memberCode,
//       });

//       // Process batch when full or at end
//       if (currentBatch.length >= MAX_BATCH_SIZE || index === users.length - 1) {
//         await Clan.findByIdAndUpdate(
//           clanId,
//           { $push: { members: { $each: currentBatch } } },
//           { session }
//         );

//         await User.updateMany(
//           {
//             _id: { $in: currentBatch.map((u) => u.user) },
//             clans: { $ne: clanId },
//           },
//           { $push: { clans: clanId } },
//           { session }
//         );

//         processedUsers.push(...currentBatch);
//         currentBatch = [];
//       }
//     }

//     await session.commitTransaction();

//     res.status(201).json({
//       success: true,
//       addedCount: processedUsers.length,
//       clan: clan.name,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     res.status(500).json({
//       error: "Processing failed",
//       details: error.message,
//     });
//   } finally {
//     session.endSession();
//   }
// };

// export const registerTestUsers = async (req, res) => {
//   const { clanId, users } = req.body; // Expects array of { name, email }
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Validate input
//     if (!users || !Array.isArray(users)) {
//       return res.status(400).json({ error: "Users array is required" });
//     }

//     const processedUsers = [];
//     const MAX_BATCH_SIZE = 20;
//     let currentBatch = [];

//     const clan = await Clan.findById(clanId).session(session);
//     if (!clan) throw new Error("Clan not found");

//     // Get the last member code before processing to ensure proper sequencing
//     const lastMember = clan.members.sort((a, b) => {
//       // Sort by creation date (assuming members have createdAt timestamps)
//       const dateA = a.createdAt || a._id.getTimestamp();
//       const dateB = b.createdAt || b._id.getTimestamp();
//       return dateB - dateA;
//     })[0];

//     let lastMemberCode = lastMember?.memberCode;
//     let nextMemberCode = generateUniqueMemberID(
//       clan.uniqueClanID,
//       lastMemberCode
//     );

//     for (const [index, userData] of users.entries()) {
//       const { name, email } = userData;

//       // Skip if missing critical fields
//       if (!name || !email) {
//         console.warn(`Skipping entry ${index} - missing name or email`);
//         continue;
//       }

//       // Check for existing user
//       const existingUser = await User.findOne({ email }).session(session);
//       let userId;

//       if (existingUser) {
//         userId = existingUser._id;
//       } else {
//         const hashedPassword = await hashPassword("123456789");

//         // Create new user
//         const [user] = await User.create(
//           [{ name, email, isVerified: true, password: hashedPassword }],
//           { session }
//         );
//         userId = user._id;

//         // Create user profile
//         await UserProfile.create([{ user: userId }], { session });

//         // Create wallet
//         await wallet.create([{ user: userId }], { session });
//       }

//       // Generate member code for this user
//       const memberCode = nextMemberCode;

//       // Calculate next member code for the following user
//       lastMemberCode = memberCode;
//       nextMemberCode = generateUniqueMemberID(
//         clan.uniqueClanID,
//         lastMemberCode
//       );

//       currentBatch.push({
//         user: userId,
//         status: "approved",
//         memberCode,
//         createdAt: new Date(), // Ensure we have creation timestamp
//       });

//       // Process batch when full or at end
//       if (currentBatch.length >= MAX_BATCH_SIZE || index === users.length - 1) {
//         await Clan.findByIdAndUpdate(
//           clanId,
//           { $push: { members: { $each: currentBatch } } },
//           { session }
//         );

//         await User.updateMany(
//           {
//             _id: { $in: currentBatch.map((u) => u.user) },
//             clans: { $ne: clanId },
//           },
//           { $push: { clans: clanId } },
//           { session }
//         );

//         processedUsers.push(...currentBatch);
//         currentBatch = [];
//       }
//     }

//     await session.commitTransaction();

//     res.status(201).json({
//       success: true,
//       addedCount: processedUsers.length,
//       clan: clan.name,
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     res.status(500).json({
//       error: "Processing failed",
//       details: error.message,
//     });
//   } finally {
//     session.endSession();
//   }
// };

const getNextNumericSequence = (current) => {
  if (!current) return "0001";
  const num = parseInt(current) + 1;
  return num > 9999 ? "0001" : String(num).padStart(4, "0");
};

const getNextAlphaSequence = (current) => {
  if (!current) return "AAAA";
  let nextAlpha = "";
  let carry = 1;
  for (let i = current.length - 1; i >= 0; i--) {
    let char = current.charCodeAt(i) + carry;
    if (char > 90) {
      // 'Z'
      char = 65; // 'A'
      carry = 1;
    } else {
      carry = 0;
    }
    nextAlpha = String.fromCharCode(char) + nextAlpha;
  }
  return nextAlpha;
};

const generateUniqueMemberID = (clanID, lastMemberCode) => {
  if (!lastMemberCode) {
    const clanPrefix = clanID.split("-")[0];
    return `${clanPrefix}-AAAA-0001`;
  }

  const [, alpha, numeric] = lastMemberCode.split("-");
  const nextAlpha = numeric === "9999" ? getNextAlphaSequence(alpha) : alpha;
  const nextNumeric =
    numeric === "9999" ? "0001" : getNextNumericSequence(numeric);

  const clanPrefix = clanID.split("-")[0];
  return `${clanPrefix}-${nextAlpha}-${nextNumeric}`;
};

// export const registerTestUsers = async (req, res) => {
//   try {
//     const { email, amount } = req.body; // Expecting email and the amount to add/subtract

//     // --- Input Validation ---
//     if (!email || !amount) {
//       return res
//         .status(400)
//         .json({ message: "Email and amount are required." });
//     }
//     if (typeof amount !== "number" || isNaN(amount)) {
//       return res
//         .status(400)
//         .json({ message: "Amount must be a valid number." });
//     }
//     // You might want to add more specific validation for 'amount' (e.g., positive, within range)

//     // 1. Find the User by email
//     const user = await User.findOne({ email: email });

//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: "User not found with the provided email." });
//     }

//     // 2. Find the Wallet associated with the user
//     const wallet = await Wallet.findOne({ user: user._id });

//     if (!wallet) {
//       return res
//         .status(404)
//         .json({ message: "Wallet not found for this user." });
//     }

//     // 3. Update the wallet balance
//     // This example ADDS the amount. Adjust as needed (e.g., set to a specific value, subtract)
//     wallet.balance += amount;

//     // 4. Save the updated wallet
//     await wallet.save();

//     res.status(200).json({
//       message: "Wallet balance updated successfully.",
//       wallet: wallet,
//       user: { email: user.email, _id: user._id }, // Return some user info for context
//     });
//   } catch (error) {
//     console.error("Error updating wallet by email:", error); // Use console.error for errors
//     res.status(500).json({ message: "Server error during wallet update." });
//   }
// };

// export const registerTestUsers = async (req, res) => {
//   try {

//     const clan = await Clan.findOne({ email: "opera4street@gmail.com" });
 
//     res.json({
//       success: true,
//       message: "Wallet balance updated to 30,000 successfully",
//       balance: clan,
//     });
//   } catch (error) {
//     console.error("Error checking wallet amount:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };


export const registerTestUsers = async (req, res) => {
  try {
    // Find the clan
    // const clan = await Clan.findById("67b1187e61243b230f3b9b21").populate("members.user");
    const clan = await Clan.findOne({ email: "opera4street@gmail.com" });


    // const membersWithoutCode = clan.members.filter(
    //   (member) => !member.memberCode || member.memberCode.trim() === ""
    // );
    // if (!clan) {
    //   return res.status(404).json({ error: "Clan not found" });
    // }

    let updatedCount = 0;

    // Loop through members and update wrong memberCodes
    // clan.members.forEach((member) => {
    //   if (member.memberCode && member.memberCode.startsWith("OPERA1--")) {
    //     member.memberCode = member.memberCode.replace("OPERA1--", "OPERA1");
    //     updatedCount++;
    //   }
    // });


    // Loop through members and update wrong memberCodes
    clan.members.forEach((member) => {
      if (member.memberCode && member.memberCode.startsWith("OPERA1--")) {
        member.memberCode = member.memberCode.replace("OPERA1--", "OPERA1-");
        updatedCount++;
      }
    });


    
    // // Save the clan with updated member codes
    await clan.save();


        // // Find members without memberCode
        // let counter = 2000;
        // for (const member of clan.members) {
        //   if (!member.memberCode) {
        //     member.memberCode = `OPERA1-AAAA-${counter}`;
        //     counter++;
        //   }
        // }
    
        // // Save the clan with updated codes
        // await clan.save();

    res.json({
      success: true,
      // membersWithoutCode,
      // message: `Fixed ${updatedCount} member codes successfully`,
      members: clan.members,
    });
  } catch (error) {
    console.error("Error fixing member codes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
