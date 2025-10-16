import VisitorInvitation from "../models/visitor.js";
import Wallet from "../models/wallet.js";
import Clan from "../models/clan.js";
import ClanWallet from "../models/ClanWallet.js";
import Due from "../models/Due.js";

// const crypto = require('crypto');
import User from "../models/user.js";
import axios from "axios";
import crypto from "crypto";
import { findUserByEmail } from "../services/Userservice.js";
// import c

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// export const fetchWallet = async (req, res) => {
//   try {
//     const wallet = await Wallet.findOne({ user: req?.user._id });

//     return res.status(200).json(wallet);
//   } catch (error) {
//     res.status(500).json({ error: "Fetching error!" });
//   }
// };

export const fetchWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req?.user._id });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found!" });
    }

    // Divide balance by 100 before returning
    const modifiedWallet = {
      ...wallet.toObject(),
      balance: wallet.balance / 100,
    };

    return res.status(200).json(modifiedWallet);
  } catch (error) {
    res.status(500).json({ error: "Fetching error!" });
  }
};

export const fundWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findOne({ _id: req?.user._id });
    const wallet = await Wallet.findOne({ user: req?.user._id });

    let email = user.email;

    // const { amount } = validatedFields.data;
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100,
        // callback_url: "http://localhost:3000/wallet",
      },
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    console.log({
      uuu: response?.data,
    });

    res.json({
      status: "success",
      data: response.data,
    });
  } catch (error) {
    console.log({
      jg: error,
    });

    res.status(500).json({ error: "Fetching error!" });
  }
};

export const PaymentWebhook = async (req, res) => {
  try {
    const isValid = verifyPaystackWebhook(req, PAYSTACK_SECRET_KEY);
    if (!isValid) {
      console.log({
        fff: "fake",
      });

      return res.status(401).send("Unauthorized");
    }

    const event = req?.body?.event;
    const data = req.body.data;

    if (event === "charge.success") {
      // Process the successful payment
      //   console.log("Payment fake:", data);

      //   let data = {
      //     id: 4779935490,
      //     domain: "test",
      //     status: "success",
      //     reference: "auhmlj7352",
      //     amount: 99900,
      //     message: null,
      //     gateway_response: "Successful",
      //     paid_at: "2025-03-15T07:20:01.000Z",
      //     created_at: "2025-03-15T07:19:52.000Z",
      //     channel: "card",
      //     currency: "NGN",
      //     ip_address: "102.88.70.250",
      //     metadata: "",
      //     fees_breakdown: null,
      //     log: null,
      //     fees: 1499,
      //     fees_split: null,
      //     authorization: {
      //       authorization_code: "AUTH_oc8xzvc7v8",
      //       bin: "408408",
      //       last4: "4081",
      //       exp_month: "12",
      //       exp_year: "2030",
      //       channel: "card",
      //       card_type: "visa ",
      //       bank: "TEST BANK",
      //       country_code: "NG",
      //       brand: "visa",
      //       reusable: true,
      //       signature: "SIG_S94rrc5e7Iy2NDbMeSrB",
      //       account_name: null,
      //     },
      //     customer: {
      //       id: 251529452,
      //       first_name: null,
      //       last_name: null,
      //       email: "pgworks0011@gmail.com",
      //       customer_code: "CUS_kgkqj1aanjhvrud",
      //       phone: null,
      //       metadata: null,
      //       risk_action: "default",
      //       international_format_phone: null,
      //     },
      //     plan: {},
      //     subaccount: {},
      //     split: {},
      //     order_id: null,
      //     paidAt: "2025-03-15T07:20:01.000Z",
      //     requested_amount: 99900,
      //     pos_transaction_data: null,
      //     source: {
      //       type: "api",
      //       source: "merchant_api",
      //       entry_point: "transaction_initialize",
      //       identifier: null,
      //     },
      //   };

      const requestedAmount = data.requested_amount; // in kobo
      const fees = data.fees; // in kobo

      // Calculate 0.5% of the requested amount
      const percentageFee = requestedAmount * 0.005; // 0.5% of requested amount

      // Add the 0.5% fee to the transaction fees
      const totalFees = fees + percentageFee;

      // Deduct the total fees from the requested amount
      const finalAmount = requestedAmount - totalFees;

      // Log the results
      console.log("Payment successful:", {
        requestedAmount: requestedAmount / 100, // Convert to Naira
        fees: fees / 100, // Convert to Naira
        percentageFee: percentageFee / 100, // Convert to Naira
        totalFees: totalFees / 100, // Convert to Naira
        finalAmount: finalAmount / 100, // Convert to Naira
      });

      let user_email = data.customer.email;

      let user_info = await findUserByEmail(user_email);

      const wallet = await Wallet.findOne({ user: user_info._id });
      let oldamount = wallet;
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      wallet.balance += finalAmount;
      await wallet.save(); // Save updated wallet

      console.log({
        requestedAmount: requestedAmount / 100, // Convert to Naira
        fees: fees / 100, // Convert to Naira
        percentageFee: percentageFee / 100, // Convert to Naira
        totalFees: totalFees / 100, // Convert to Naira
        finalAmount: finalAmount / 100, // Convert to Naira
        message: "Wallet updated successfully",
        oldamount,
        wallet,
      });

      res.json({
        requestedAmount: requestedAmount / 100, // Convert to Naira
        fees: fees / 100, // Convert to Naira
        percentageFee: percentageFee / 100, // Convert to Naira
        totalFees: totalFees / 100, // Convert to Naira
        finalAmount: finalAmount / 100, // Convert to Naira
        message: "Wallet updated successfully",
        wallet,
      });
    } else {
      console.log("Payment successful:", { data: req.body });
      res.json(data);
    }
  } catch (error) {
    console.log({
      jg: error,
    });

    res.status(500).json({ error: "Fetching error!" });
  }
};

export const getUserDuesToPay = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming the authenticated user's ID is available in `req.user`

    console.log({
      jgj: userId,
    });

    // Find all dues where the user is in the `membersToPay` array
    const dues = await Due.find({
      "membersToPay.user": userId,
      //   "membersToPay.status": { $in: ["pending", "overdue"] }, // Filter by status
    })
      .sort({ createdAt: -1 })
      .populate("membersToPay.user", "name email") // Populate member details

      .populate("clan", "name") // Populate clan details
      .populate("createdBy", "name email"); // Populate creator details

    //   if (!dues.length) {
    //     return res.status(404).json({ message: "No dues found for you to pay" });
    //   }

    // const filteredDues = dues.map((due) => {
    //   const userPayment = due.membersToPay.find(
    //     (member) => member.user._id.toString() === userId.toString()
    //   );

    //   return {
    //     ...due.toObject(),
    //     membersToPay: [userPayment], // Include only the authenticated user
    //   };
    // });

    const filteredDues = dues.map((due) => {
      const userPayment = due.membersToPay.find(
        (member) => member.user._id.toString() === userId.toString()
      );

      return {
        ...due.toObject(), // Convert Mongoose document to plain JavaScript object
        membersToPay: userPayment ? [userPayment] : [], // Include only the authenticated user's payment
      };
    });

    res.status(200).json({ dues: filteredDues });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching dues", error: error.message });
  }
};

import mongoose from "mongoose";

export const payDue = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { dueId } = req.params;
    const userId = req.user._id;

    const due = await Due.findOne({
      _id: dueId,
      "membersToPay.user": userId,
    }).session(session);

    if (!due) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Due not found or you are not required to pay this due",
      });
    }

    const userPayment = due.membersToPay.find(
      (member) => member.user._id.toString() === userId.toString()
    );

    if (!userPayment) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(404)
        .json({ message: "Payment entry not found for this user" });
    }

    if (userPayment.status === "paid") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "This due has already been paid" });
    }

    const userWallet = await Wallet.findOne({ user: userId }).session(session);

    if (!userWallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "User wallet not found" });
    }

    let nariaamount = userWallet.balance / 100;

    if (nariaamount < due.amount) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "Insufficient balance in your wallet" });
    }

    userWallet.balance = userWallet.balance / 100 - due.amount; // Convert to naira, subtract
    userWallet.balance = Math.round(userWallet.balance * 100); // Convert back to kobo
    await userWallet.save({ session });

    const clanWallet = await ClanWallet.findOne({ clan: due.clan }).session(
      session
    );

    if (!clanWallet) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Clan wallet not found" });
    }

    clanWallet.balance += due.amount;
    await clanWallet.save({ session });

    userPayment.status = "paid";
    await due.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: "Payment successful",
      userPayment,
      userWallet,
      nariaamount,
      clanWallet,
      due,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res
      .status(500)
      .json({ message: "Error processing payment", error: error.message });
  }
};

function verifyPaystackWebhook(req, secretKey) {
  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(JSON.stringify(req.body))
    .digest("hex");
  return hash === req.headers["x-paystack-signature"];
}

// Admin wallet

// Usage in an Express route

// import Clan from "../models/Clan.js";
// import ClanWallet from "../models/ClanWallet.js";

// import Clan from "../models/Clan.js";
// import ClanWallet from "../models/ClanWallet.js";

// export const createWalletsForAllClans = async (req, res) => {
//   try {
//     // Get all clans
//     const clans = await Clan.find();

//     if (!clans.length) {
//       return res.status(404).json({ message: "No clans found" });
//     }

//     let createdWallets = [];

//     for (let clan of clans) {
//       // Check if a wallet already exists for the clan
//       const existingWallet = await ClanWallet.findOne({ clan: clan._id });

//       if (!existingWallet) {
//         // Create wallet if it doesn't exist
//         const wallet = new ClanWallet({ clan: clan._id });
//         await wallet.save();
//         createdWallets.push(wallet);
//       }
//     }

//     if (createdWallets.length === 0) {
//       return res
//         .status(200)
//         .json({ message: "All clans already have wallets" });
//     }

//     res.status(201).json({
//       message: `Wallets created for ${createdWallets.length} clans`,
//       wallets: createdWallets,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Error creating wallets", error: error.message });
//   }
// };

export const fetchClanWallet = async (req, res) => {
  try {
    let clan = req.clan;
    const clanwallet = await ClanWallet.findOne({ clan: clan._id });
    return res.status(200).json({ clan: clanwallet });
  } catch (error) {
    res.status(500).json({ error: "Fetching error!" });
  }
};

export const createDue = async (req, res) => {
  try {
    let clanId = req.clan._id;

    const { serviceName, serviceDetails, amount, dueDate, members } = req.body;
    const adminId = req.user._id; // Assuming you get the logged-in admin's ID from authentication

    // Check if the clan exists
    const clan = await Clan.findById(clanId);
    if (!clan) {
      return res.status(404).json({ message: "Clan not found" });
    }

    // Ensure admin belongs to the clan
    const isAdmin = clan.admins.some(
      (admin) => admin.user.toString() === adminId
    );
    if (!isAdmin) {
      return res.status(403).json({
        message: "You are not authorized to create dues for this clan",
      });
    }

    // Ensure the members exist in the clan
    const filteredMembers = clan.members.filter((member) =>
      members.includes(member.user.toString())
    );

    if (filteredMembers.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid members selected for dues" });
    }

    // Create the due record
    const due = new Due({
      clan: clanId,
      serviceName,
      serviceDetails,
      amount,
      dueDate,
      membersToPay: filteredMembers.map((member) => ({
        user: member.user,
        status: "pending",
      })),
      createdBy: adminId,
    });

    await due.save();
    res.status(201).json({ message: "Due created successfully", due });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating due", error: error.message });
  }
};

export const ClanAdmingetDues = async (req, res) => {
  try {
    let clanId = req.clan._id;

    // Fetch all dues for the given clan
    const dues = await Due.find({ clan: clanId })
      .sort({ createdAt: -1 })
      .populate("clan", "name") // Populate clan name
      .populate("membersToPay.user", "name email") // Populate member details
      .populate("createdBy", "name email"); // Populate creator details

    if (!dues.length) {
      return res.status(404).json({ message: "No dues found for this clan" });
    }

    res.status(200).json({ dues });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching dues", error: error.message });
  }
};

export const getDueById = async (req, res) => {
  try {
    let clanId = req.clan._id;

    const { dueId } = req.params;
    // Find the due in the specified clan
    const due = await Due.findOne({ _id: dueId, clan: clanId })
      .populate("clan", "name") // Populate clan name
      .populate("membersToPay.user", "name email") // Populate members' details
      .populate("createdBy", "name email"); // Populate the creator details
    if (!due) {
      return res.status(404).json({ message: "Due not found in this clan" });
    }
    res.status(200).json({ due });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching due", error: error.message });
  }
};

export const ClanAdminDeleteDue = async (req, res) => {
  try {
    let clanId = req.clan._id;

    const { dueId } = req.params;
    // Check if the due exists and belongs to the specified clan
    const due = await Due.findOne({ _id: dueId, clan: clanId });

    if (!due) {
      return res
        .status(404)
        .json({ message: "Due not found or does not belong to this clan" });
    }

    // Delete the due
    await Due.deleteOne({ _id: dueId });

    res.status(200).json({ message: "Due deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting due", error: error.message });
  }
};

export const CreateWalletsForAllUsers = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find({});

    // Iterate through each user
    for (const user of users) {
      // Check if the user already has a wallet
      const existingWallet = await Wallet.findOne({ user: user._id });

      if (!existingWallet) {
        // Create a new wallet for the user
        const newWallet = new Wallet({
          user: user._id,
          balance: 0, // Default balance
          currency: "NGN", // Default currency
        });

        // Save the wallet to the database
        await newWallet.save();
        console.log(`Wallet created for user: ${user.email}`);
      } else {
        console.log(`Wallet already exists for user: ${user.email}`);
      }
    }

    // Send success response
    res.status(200).json({
      success: true,
      message: "Wallet creation process completed.",
    });
  } catch (error) {
    console.error("Error creating wallets:", error);
    res.status(500).json({
      success: false,
      message: "Error creating wallets",
      error: error.message,
    });
  }
};

// this is for clan rate
