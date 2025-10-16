import axios from "axios";
import { Router } from "express";
import { requireSignin } from "../middlewares/auth.js";
import { checkClan_IsAproved_and_MemberAproved_noParams } from "../middlewares/clan.js";
import wallet from "../models/wallet.js";
import mongoose from "mongoose";
import buyTransactionSchema from "./buyTransactionSchema.js";
import Transaction from "../models/Transaction.js";
// import wallet from "../models/wallet.js";

const captainMetterrootRouter = Router();

let captainCourtCompanyName = "HydroMarine";
let captainCourtUserName = "Pausepoint";
let captainCourtPassword = "Pausepoint123";
const BASE_URL = "http://www.server-newa.stronpower.com/api";

// Helper: call Stron API
async function callStronAPI(endpoint, payload) {
  const response = await axios.post(`${BASE_URL}${endpoint}`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return response.data;
}

const electricityRates = {
  amountPerUnit: 230,
  vatPerUnit: 20,
  serviceFeePerUnit: 10,
};

captainMetterrootRouter.get("/electricity-rates", (req, res) => {
  res.json(electricityRates);
});

captainMetterrootRouter.get(
  "/",
  requireSignin,
  checkClan_IsAproved_and_MemberAproved_noParams,
  async (req, res) => {
    try {
      let userID = req.user._id;
      let clanId = req.clan._id;
      const transactions = await buyTransactionSchema
        .find({ user: userID, clan: clanId }) // filter by both user & clan
        .populate("user", "name email") // show basic user info
        .populate("clan", "name uniqueClanID") // show clan info
        .sort({ createdAt: -1 }); // newest first
      res.json({ success: true, count: transactions.length, transactions });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

captainMetterrootRouter.post("/vend", async (req, res) => {
  try {
    const { meterId } = req.body;
    const payload = {
      CompanyName: captainCourtCompanyName,
      UserName: captainCourtUserName,
      PassWord: captainCourtPassword, // process.env.STRON_PASSWORD,
      // CustomerId: "CTS-00222",
      MeterId: meterId,
    };
    // const data = await callStronAPI("/QueryCustomerInfo", payload);
    const data = await callStronAPI("/QueryMeterInfo", payload);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Query Meter Credit
captainMetterrootRouter.post("/query-meter-credit", async (req, res) => {
  try {
    const { meterId } = req.body;
    const payload = {
      CompanyName: captainCourtCompanyName,
      UserName: captainCourtUserName,
      PassWord: captainCourtPassword, // process.env.STRON_PASSWORD,
      // CustomerId: "CTS-00222",
      MeterId: meterId,
    };
    const data = await callStronAPI("/QueryMeterCredit", payload);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

captainMetterrootRouter.post(
  "/buy",
  requireSignin,
  checkClan_IsAproved_and_MemberAproved_noParams,
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    // this is  fot the unitx
    try {
      const { meterId, units } = req.body;

      let userID = req.user;
      let ClanId = req.clan;

      if (!ClanId || ClanId._id != "6807bbbf6152e3e0bb049580") {
        return res.status(403).json({
          success: false,
          message: "This clan is not allowed to perform vending transactions  ",
          data: { user: userID, clan: ClanId },
        });
      }

      // // Constants
      const amountPerUnit = 260;

      // // Calculations
      const appAmountRecorded = units * amountPerUnit;

      const wallet_info = await wallet
        .findOne({ user: userID._id })
        .session(session);
      const wallet_info_balance_naria = wallet_info.balance / 100;

      // Check if wallet balance is enough
      if (wallet_info_balance_naria < appAmountRecorded) {
        throw new Error("Insufficient wallet balance to complete transaction");
      }

      // // ✅ Deduct balance
      wallet_info.balance -= appAmountRecorded * 100; // store in kobo
      await wallet_info.save({ session });

      // Step 2: Call API with only the actual amount (without VAT)
      const payload = {
        CompanyName: captainCourtCompanyName,
        UserName: captainCourtUserName,
        PassWord: captainCourtPassword,
        MeterId: meterId,
        is_vend_by_unit: "true",
        Amount: units.toString(),
        // Amount: amountPerUnit.toString(),
      };

      const apiResponse = await callStronAPI("/VendingMeter", payload);

      const transactionData = apiResponse[0];
      if (!transactionData.Token) {
        throw new Error("Vending failed");
      }

      // Step 3: Save BuyTransaction
      const newTransaction = new buyTransactionSchema({
        user: userID._id,
        clan: ClanId._id,
        customerId: transactionData.Customer_id,
        customerName: transactionData.Customer_name,
        customerAddress: transactionData.Customer_address,
        customerPhone: transactionData.Customer_phone,
        meterId: transactionData.Meter_id,
        meterType: transactionData.Meter_type,
        totalPaid: appAmountRecorded,
        // vat: vatTotal,
        // serviceFee: serviceFeeTotal,
        totalAmount: transactionData.Total_paid,
        totalUnit: transactionData.Total_unit, //units,
        unit: transactionData.Unit,
        pricePerUnit: amountPerUnit,
        priceUnitCurrency: transactionData.Price_unit,
        priceCategories: transactionData.Price_Categories,
        rate: Number(transactionData.Rate),
        token: transactionData.Token,
        isVendByUnit: true,
        genTime: new Date(transactionData.Gen_time),
      });

      await newTransaction.save({ session });

      // // ✅ Commit the transaction
      await session.commitTransaction();
      session.endSession();

      return res.json({
        success: true,
        message: "Transaction successful",
        data: {
          // wallet_balance: wallet_info.balance / 100,
          // transactionData,
          // newTransaction ,

          wallet_balance: wallet_info.balance / 100,
          transaction: newTransaction,
          apiResponse,
        },
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      console.error("❌ Transaction failed:", err);
      res.status(500).json({ success: false, error: err.message });
    }

    // end here

    // try {
    //   const { meterId, units } = req.body;

    //   let userID = req.user;
    //   let ClanId = req.clan;

    //   // ✅ Block if clan uniqueClanID is not "CCE-9-2025"
    //   if (!ClanId || ClanId._id != "6807bbbf6152e3e0bb049580") {
    //     return res.status(403).json({
    //       success: false,
    //       message: "This clan is not allowed to perform vending transactions  ",
    //       data: { user: userID, clan: ClanId },
    //     });
    //   }

    //   // Constants
    //   const amountPerUnit = 230;
    //   const vatPerUnit = 20;
    //   const servicePerUnit = 10;

    //   // Calculations
    //   const amountForAPI = units * amountPerUnit;
    //   const vatTotal = units * vatPerUnit;
    //   const serviceFeeTotal = units * servicePerUnit;
    //   const estateAmount = amountForAPI + vatTotal;
    //   const appAmountRecorded = estateAmount + serviceFeeTotal;

    //   if (appAmountRecorded < 10000) {
    //     throw new Error("Amount too small. Minimum allowed is ₦10,000.");
    //   }

    //   if (appAmountRecorded > 50000) {
    //     throw new Error("Amount too large. Maximum allowed is ₦50,000.");
    //   }
    //   // Get wallet (with transaction session)
    //   const wallet_info = await wallet
    //     .findOne({ user: userID._id })
    //     .session(session);
    //   const wallet_info_balance_naria = wallet_info.balance / 100;

    //   // Check if wallet balance is enough
    //   if (wallet_info_balance_naria < appAmountRecorded) {
    //     throw new Error("Insufficient wallet balance to complete transaction");
    //   }

    //   // ✅ Deduct balance
    //   wallet_info.balance -= appAmountRecorded * 100; // store in kobo
    //   await wallet_info.save({ session });

    //   // Step 2: Call API with only the actual amount (without VAT)
    //   const payload = {
    //     CompanyName: captainCourtCompanyName,
    //     UserName: captainCourtUserName,
    //     PassWord: captainCourtPassword,
    //     MeterId: meterId,
    //     is_vend_by_unit: "false",
    //     Amount: amountForAPI.toString(),
    //   };

    //   const apiResponse = await callStronAPI("/VendingMeter", payload);

    //   const transactionData = apiResponse[0];
    //   // if (!transactionData.success) {
    //   //   throw new Error("Vending failed");
    //   // }

    //   // // Step 3: Save BuyTransaction
    //   const newTransaction = new buyTransactionSchema({
    //     user: userID._id,
    //     clan: ClanId._id,
    //     customerId: transactionData.Customer_id,
    //     customerName: transactionData.Customer_name,
    //     customerAddress: transactionData.Customer_address,
    //     customerPhone: transactionData.Customer_phone,
    //     meterId: meterId,
    //     meterType: transactionData.Meter_type,
    //     totalPaid: amountForAPI,
    //     vat: vatTotal,
    //     serviceFee: serviceFeeTotal,
    //     totalAmount: appAmountRecorded,
    //     totalUnit: units,
    //     unit: transactionData.Unit,
    //     pricePerUnit: amountPerUnit,
    //     priceUnitCurrency: transactionData.Price_unit,
    //     priceCategories: transactionData.Price_Categories,
    //     rate: Number(transactionData.Rate),
    //     token: transactionData.Token,
    //     isVendByUnit: true,
    //     genTime: new Date(transactionData.Gen_time),
    //   });

    //   await newTransaction.save({ session });

    //   // // ✅ Commit the transaction
    //   await session.commitTransaction();
    //   session.endSession();

    //   return res.json({
    //     success: true,
    //     message: "Transaction successful",
    //     data: {
    //       wallet_balance: wallet_info.balance / 100,
    //       transaction: newTransaction,
    //       apiResponse,
    //     },
    //   });
    // } catch (err) {
    //   await session.abortTransaction();
    //   session.endSession();

    //   console.error("❌ Transaction failed:", err);
    //   res.status(500).json({ success: false, error: err.message });
    // }
  }
);

// ✅ Get all buy transactions and populate user + clan
captainMetterrootRouter.get(
  "/get-transactions",
  // requireSignin,
  async (req, res) => {
    try {
      const transactions = await buyTransactionSchema
        .find()
        .populate("user", "name email") // only return name & email from user
        .populate("clan", "name email uniqueClanID"); // only return basic clan info
      res.json({
        success: true,
        count: transactions.length,
        data: transactions,
      });
    } catch (err) {
      console.error("Error fetching transactions:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

captainMetterrootRouter.get("/fake", requireSignin, async (req, res) => {
  try {
    let user_data = req.user._id;
    const wallet_info = await wallet.findOne({ user: user_data });

    wallet_info.balance = 100000;

    await wallet_info.save();
    res.json({
      user_data,
      wallet_info,
      // success: true,
      // count: transactions.length,
      // data: transactions,
    });
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

captainMetterrootRouter.get("/admin", async (req, res) => {
  try {
    const transactions = await buyTransactionSchema
      .find()
      .populate("user", "fullName email") // populate selected fields from User
      .populate("clan", "name"); // populate selected fields from Clan
    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching buy transactions:", error);
    res.status(500).json({
      success: false,
      message: "Server Error while fetching transactions",
    });
  }
});

captainMetterrootRouter.get("/all_user_transaction_admin", async (req, res) => {
  try {
    // Basic pagination/filtering can be added here
    const transactions = await Transaction.find()
      .populate("user", "name email") // Assuming 'User' model is linked
      .sort({ createdAt: -1 }); // Latest transactions first
    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

captainMetterrootRouter.get("/all_user_wallet", async (req, res) => {
  try {
    // 1. Fetch all wallets, populate user details, and SORT by balance DESCENDING (-1)
    const wallet_data = await wallet
      .find()
      .populate("user", "name email") // Populate user name and email
      .sort({ balance: -1 }); // <-- ADDED: Sorts by the 'balance' field (in kobo) from highest to lowest

    if (!wallet_data || wallet_data.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No wallets found.",
        data: [],
      });
    }

    // 2. Map over the data to convert the balance from kobo to Naira
    const walletsInNaira = wallet_data.map((walletDoc) => {
      // Use toObject() or lean() to safely modify the Mongoose document
      const walletObject = walletDoc.toObject
        ? walletDoc.toObject()
        : walletDoc;

      // Conversion from Kobo to Naira (Balance / 100)
      walletObject.balance = walletObject.balance / 100;

      return walletObject;
    });

    // 3. Send the response with the converted balances
    res.status(200).json({
      success: true,
      count: walletsInNaira.length, // Include count as a good practice
      data: walletsInNaira,
    });
  } catch (error) {
    console.error("Error fetching all user wallets:", error);
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        error: "Database query error.",
      });
    }
    res.status(500).json({
      success: false,
      error: "Server Error: " + error.message,
    });
  }
});

captainMetterrootRouter.post(
  "/buy/fire",
  requireSignin,
  checkClan_IsAproved_and_MemberAproved_noParams,
  async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { meterId, units } = req.body;

      let userID = req.user;
      let ClanId = req.clan;

      if (!ClanId || ClanId._id != "6807bbbf6152e3e0bb049580") {
        return res.status(403).json({
          success: false,
          message: "This clan is not allowed to perform vending transactions  ",
          data: { user: userID, clan: ClanId },
        });
      }

      // // Constants
      const amountPerUnit = 260;

      // // Calculations
      const appAmountRecorded = units * amountPerUnit;

      const wallet_info = await wallet
        .findOne({ user: userID._id })
        .session(session);
      const wallet_info_balance_naria = wallet_info.balance / 100;

      // Check if wallet balance is enough
      if (wallet_info_balance_naria < appAmountRecorded) {
        throw new Error("Insufficient wallet balance to complete transaction");
      }

      // // ✅ Deduct balance
      wallet_info.balance -= appAmountRecorded * 100; // store in kobo
      await wallet_info.save({ session });

      // Step 2: Call API with only the actual amount (without VAT)
      const payload = {
        CompanyName: captainCourtCompanyName,
        UserName: captainCourtUserName,
        PassWord: captainCourtPassword,
        MeterId: meterId,
        is_vend_by_unit: "true",
        Amount: units.toString(),
        // Amount: amountPerUnit.toString(),
      };

      const apiResponse = await callStronAPI("/VendingMeter", payload);

      const transactionData = apiResponse[0];
      if (!transactionData.Token) {
        throw new Error("Vending failed");
      }

      // Step 3: Save BuyTransaction
      const newTransaction = new buyTransactionSchema({
        user: userID._id,
        clan: ClanId._id,
        customerId: transactionData.Customer_id,
        customerName: transactionData.Customer_name,
        customerAddress: transactionData.Customer_address,
        customerPhone: transactionData.Customer_phone,
        meterId: transactionData.Meter_id,
        meterType: transactionData.Meter_type,
        totalPaid: appAmountRecorded,
        // vat: vatTotal,
        // serviceFee: serviceFeeTotal,
        totalAmount: transactionData.Total_paid,
        totalUnit: transactionData.Total_unit, //units,
        unit: transactionData.Unit,
        pricePerUnit: amountPerUnit,
        priceUnitCurrency: transactionData.Price_unit,
        priceCategories: transactionData.Price_Categories,
        rate: Number(transactionData.Rate),
        token: transactionData.Token,
        isVendByUnit: true,
        genTime: new Date(transactionData.Gen_time),
      });

      await newTransaction.save({ session });

      // // ✅ Commit the transaction
      await session.commitTransaction();
      session.endSession();

      return res.json({
        success: true,
        message: "Transaction successful",
        data: {
          // wallet_balance: wallet_info.balance / 100,
          // transactionData,
          // newTransaction ,

          wallet_balance: wallet_info.balance / 100,
          transaction: newTransaction,
          apiResponse,
        },
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      console.error("❌ Transaction failed:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);
export default captainMetterrootRouter;
