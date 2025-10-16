import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import fileUpload from "express-fileupload";
import morgan from "morgan";
import authRouter from "./src/routes/auth.js";
import userRouter from "./src/routes/user.js";
import profileRouter from "./src/routes/profile.js";
import eventRouter from "./src/routes/event.js";
import categoryRouter from "./src/routes/category.js";
import ticketEventRouter from "./src/routes/ticket.js";
import forumRoute from "./src/routes/forumRoute.js";
import clanRouter from "./src/routes/clan.js";
import visitorRouter from "./src/routes/visitor.js";
import emergencyreportRouter from "./src/routes/emergencyreport.js";
import cors from "cors";
// import { Server } from "socket.io";
import http from "http";
import pollRouter from "./src/routes/poll.js";
import paymentRouter from "./src/routes/payment.js";
import ratingRouter from "./src/routes/ratings.js";
import { socketLogic } from "./src/controllers/socketLogic.js";
import complaintRouter from "./src/routes/complaints.js";
import vendorCategoryRouter from "./src/routes/vendorCategory.js";
import serviceVendorRouter from "./src/routes/serviceVendor.js";
import marketPlaceRouter from "./src/routes/marketPlace.js";
import OthersPlaceRouter from "./src/routes/Others.js";
import domesticStaffRouter from "./src/routes/domesticstaffroute.js";
import AmentitesRouter from "./src/routes/AmenitiesRoute.js";
import WalletRouter from "./src/routes/walletRoute.js";
import notFound from "./src/middlewares/notFound.js";
import errorMiddleware from "./src/middlewares/error.js";
import connectDB from "./src/config/connectDB.js";
import { app, server } from "./src/socket/index.js";
import { createAdminUser } from "./src/v2/utils/createSuperAdmin.js";
// import socketInitializer from "./src/socket/index";

import residentEventRouter from "./src/routes/residentEvent.js";
import { cloneDatabase } from "./cloneDB.js";
import v1rootRouter from "./src/v2/routers/index.js";
import user from "./src/models/user.js";
import captainMetterrootRouter from "./src/captainCourt/index.js";

import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import handlebars from "handlebars";

// const app = express();
dotenv.config();

let corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://pause-web.vercel.app",
  ],
};

// const app = express();
// const httpServer = require("http").Server(app);
// const io = socketInitializer(httpServer);

const port = process.env.PORT || 5050;

// Middlewares
// app.use(cors(corsOptions));

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    // limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit if needed
  })
);

app.use("/", userRouter);
app.use("/", authRouter);
app.use("/", eventRouter);
app.use("/", categoryRouter);
app.use("/", ticketEventRouter);

app.use("/rating", ratingRouter);
app.use("/profile", profileRouter);
app.use("/forum", forumRoute);
app.use("/clan", clanRouter);
app.use("/visitor", visitorRouter);
app.use("/emargencyreport", emergencyreportRouter);
app.use("/poll", pollRouter);
app.use("/payments", paymentRouter);
app.use("/complaint", complaintRouter);
app.use("/services", vendorCategoryRouter);
app.use("/resident-event", residentEventRouter);
app.use("/domesticstaff", domesticStaffRouter);
app.use("/market", marketPlaceRouter);
app.use("/amenities", AmentitesRouter);
app.use("/other", OthersPlaceRouter);
app.use("/wallet", WalletRouter);
// app.use("/wallet", WalletRouter);
app.use("/api", v1rootRouter);
app.use("/api/captain", captainMetterrootRouter);

app.use("/services/vendors", serviceVendorRouter);

app.get("/invoice/fast", async (req, res) => {
  try {
    const templatePath = path.join(
      process.cwd(),
      "templates",
      "invoiceTemplate.html"
    );
    let html = fs.readFileSync(templatePath, "utf8");

    // Replace placeholders
    html = html.replace("{{date}}", new Date().toLocaleDateString());
    html = html.replace("{{userCoder}}", "U12345");
    html = html.replace("{{customerNo}}", "C98765");
    html = html.replace("{{meterNo}}", "M112233");
    html = html.replace("{{activity}}", "Electricity Purchase");
    html = html.replace("{{district}}", "Ajah");
    html = html.replace("{{accountNo}}", "ACC009988");
    html = html.replace("{{payment}}", "Paystack");
    html = html.replace("{{address}}", "Lagos, Nigeria");
    html = html.replace("{{value}}", "₦20,000");
    html = html.replace("{{token}}", "1234-5678-9012");
    html = html.replace("{{vat}}", "₦500");
    html = html.replace("{{totalFees}}", "₦20,500");
    html = html.replace("{{amountPaid}}", "₦20,500");
    html = html.replace("{{netValue}}", "₦20,000");

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    // ✅ Important: set headers for PDF
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=invoice.pdf",
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer); // ✅ send as Buffer, not string
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).send("Error generating PDF");
  }
});

// const crypto = require('crypto');
import crypto from "crypto";
import Transaction from "./src/models/Transaction.js";
import wallet from "./src/models/wallet.js";
import VirtualAccount from "./src/models/VirtualAccount.js";
const apiKey = process.env.EXTERNAL_API_KEY;
// Using Express app
// app.post("/api/v3/webhook", (req, res) => {
//   console.log("Webhook received:", req.body);

//   const hash = crypto
//     .createHmac("sha512", apiKey)
//     .update(JSON.stringify(req.body))
//     .digest("hex");

//   if (hash !== req.headers["signature"]) {
//     // SECURITY FAIL: Reject the request if the signature is invalid
//     console.warn("Webhook validation failed: Invalid signature.");
//     return res.status(401).send("Invalid signature");
//   }

//   // //validate event
//   // const hash = crypto
//   //   .createHmac("sha512", apiKey)
//   //   .update(JSON.stringify(req.body))
//   //   .digest("hex");
//   // if (hash == req.headers["signature"]) {
//   //   // Retrieve the request's body
//   //   const event = req.body;

//   //   console.log({
//   //     xxxcxxx: event,
//   //   });

//   //   // Do something with event...
//   // }
//   res.send(200);
// });

// app.post("/api/v3/webhook", async (req, res) => {
//   console.log("Webhook received:", req.body);

//   const webhookSecret = process.env.EXTERNAL_API_KEY; // Ensure this is set in your env vars

//   // 1. Validate the event signature
//   const hash = crypto
//     .createHmac("sha512", webhookSecret)
//     .update(JSON.stringify(req.body))
//     .digest("hex");

//   if (hash !== req.headers["signature"]) {
//     // SECURITY FAIL: Reject the request if the signature is invalid
//     console.warn("Webhook validation failed: Invalid signature.");
//     return res.status(401).send("Invalid signature");
//   }

//   // Signature is valid, process the event
//   const event = req.body;

//   // 2. Process based on event type and status
//   if (
//     event.service === "payments" &&
//     event.type === "reserved_account" &&
//     event.status === "successful"
//   ) {
//     try {
//       const transactionData = event.data;

//       // The key to finding the user is the reserved_account.reference,
//       // which should match the 'providerReference' in your VirtualAccount model.
//       const virtualAccountReference =
//         transactionData.reserved_account.reference;
//       const amountInNaira = transactionData.amount; // Amount is likely in the smallest unit (Kobo)
//       // const amountInNaira = amountInKobo / 100;

//       // a. Find the VirtualAccount associated with the webhook reference
//       const accountRecord = await VirtualAccount.findOne({
//         providerReference: virtualAccountReference,
//       }).populate("user");

//       if (!accountRecord) {
//         // Log error if account isn't found, but return 200 so the provider stops retrying
//         console.error(
//           `Virtual account not found for reference: ${virtualAccountReference}`
//         );
//         return res.sendStatus(200);
//       }

//       console.log({
//         james_reserved_account: transactionData.reserved_account,
//         accountRecord,
//       });

//       const userId = accountRecord.user._id;

//       // b. Check for duplicate transaction using the 'reference' field
//       // (This is the payment gateway's unique transaction ID)
//       const existingTxn = await Transaction.findOne({
//         reference: transactionData.reference,
//       });
//       if (existingTxn) {
//         console.warn(
//           `Duplicate transaction received: ${transactionData.reference}`
//         );
//         return res.sendStatus(200);
//       }

//       // c. Create a new Transaction record
//       const newTransaction = await Transaction.create({
//         user: userId,
//         amount: amountInNaira, // Store in Naira
//         currency: transactionData.currency,
//         reference: transactionData.reference,
//         type: "credit",
//         status: "completed",
//         details: transactionData.narration,
//         // Add more fields as needed, e.g., bank details, source account
//       });

//       // d. (Crucial) Update the user's wallet/balance
//       // You would typically have a Wallet or User model update here:
//       // await User.findByIdAndUpdate(userId, {
//       //   $inc: { walletBalance: amountInNaira },
//       // });

//       const wallet_Data = await wallet.findOne({ user: user_info._id });
//       if (!wallet_Data) {
//         return res.status(404).json({ message: "Wallet not found" });
//       }

//       wallet_Data.balance += amountInNaira * 100;
//       await wallet_Data.save(); // Save updated wallet

//       console.log({
//         wallet_after_credit: wallet_Data,
//         newTransaction,
//       });

//       console.log(
//         `Successfully credited user ${userId} with ${amountInNaira} NGN. Txn ID: ${newTransaction._id}`
//       );
//     } catch (error) {
//       console.error(
//         "Error processing successful reserved_account webhook:",
//         error
//       );
//       // Respond with 500 or 200, depending on payment provider's retry policy.
//       // 200 is often safer to prevent excessive retries.
//       return res.status(500).send("Internal Server Error during processing");
//     }
//   } else {
//     // Ignore other event types or unsuccessful statuses
//     console.log(`Ignored event: Type=${event.type}, Status=${event.status}`);
//   }

//   // 3. Always respond with 200 OK for successfully processed or ignored webhooks
//   // This tells the payment provider that you received the event and they should not retry.
//   res.sendStatus(200);
// });

app.post("/api/v3/webhook", async (req, res) => {
  console.log("Webhook received:", req.body);

  const webhookSecret = process.env.EXTERNAL_API_KEY;

  // 1. Validate the event signature
  const hash = crypto
    .createHmac("sha512", webhookSecret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["signature"]) {
    console.warn("Webhook validation failed: Invalid signature.");
    return res.status(401).send("Invalid signature");
  }

  // Signature is valid, process the event
  const event = req.body;

  // let event = {
  //   service: "payments",
  //   type: "reserved_account",
  //   status: "successful",
  //   data: {
  //     amount: 1100,
  //     currency: "NGN",
  //     narration: "8124782753/8261166746/PG Works Servic",
  //     source_account: {
  //       account_name: "SAMUEL NDUKWE",
  //       account_number: "8124782753",
  //       bank_code: "100004",
  //     },
  //     metadata: null,
  //     reference: "xBpLdiQIAle48X2bM3hpr" + Math.floor(Math.random() * 1000000),
  //     reserved_account: {
  //       // account_details: [Object],
  //       account_details: {
  //         account_number: "8261166746",
  //         bank_name: "Wema Bank",
  //         account_name: "Pausepoint Support",
  //       },
  //       reference: "R9APHDYLAGC0eCWhGuNw",
  //     },
  //     split: {},
  //   },
  // };

  // 2. Process based on event type and status
  if (
    event.service === "payments" &&
    event.type === "reserved_account" &&
    event.status === "successful"
  ) {
    try {
      const transactionData = event.data;

      const virtualAccountReference =
        transactionData.reserved_account.reference;
      const amountInNaira = transactionData.amount;

      // ✅ Step 1: calculate fee
      const fee = calculateTransactionFee(amountInNaira);

      // ✅ Step 2: calculate net amount to credit
      const netAmount = amountInNaira - fee;

      console.log({
        gross: amountInNaira,
        fee,
        netAmount,
      });

      // a. Find the VirtualAccount associated with the webhook reference
      const accountRecord = await VirtualAccount.findOne({
        providerReference: virtualAccountReference,
      }).populate("user");

      if (!accountRecord) {
        console.error(
          `Virtual account not found for reference: ${virtualAccountReference}`
        );
        return res.sendStatus(200);
      }

      console.log({
        james_reserved_account: transactionData.reserved_account,
        accountRecord,
      });

      const userId = accountRecord.user._id;

      // b. Check for duplicate transaction
      const existingTxn = await Transaction.findOne({
        reference: transactionData.reference,
      });
      if (existingTxn) {
        console.warn(
          `Duplicate transaction received: ${transactionData.reference}`
        );
        return res.sendStatus(200);
      }

      // c. Create a new Transaction record
      const newTransaction = await Transaction.create({
        user: userId,
        // amount: amountInNaira,
        amount: netAmount,
        currency: transactionData.currency,
        reference: transactionData.reference,
        type: "credit",
        status: "completed",
        details: transactionData.narration,
      });

      // d. Update the user's wallet/balance
      // FIX: Changed user_info._id to userId
      const wallet_Data = await wallet.findOne({ user: userId });
      if (!wallet_Data) {
        console.error(`Wallet not found for user: ${userId}`);
        return res.status(404).json({ message: "Wallet not found" });
      }

      // wallet_Data.balance += amountInNaira * 100;

      wallet_Data.balance += netAmount * 100; // in kobo
      await wallet_Data.save();

      console.log({
        wallet_after_credit: wallet_Data,
        newTransaction,
      });

      console.log({
        credited_amount: netAmount,
        deducted_fee: fee,
        wallet_balance: wallet_Data.balance,
      });

      console.log(
        `Successfully credited user ${userId} with ${amountInNaira} NGN. Txn ID: ${newTransaction._id}`
      );

      // return res
      //   .status(200)
      //   .json({
      //     message: "Webhook processed successfully",
      //     wallet_after_credit: wallet_Data,
      //     newTransaction,
      //   });
    } catch (error) {
      console.error(
        "Error processing successful reserved_account webhook:",
        error
      );
      return res.status(500).send("Internal Server Error during processing");
    }
  } else {
    console.log(`Ignored event: Type=${event.type}, Status=${event.status}`);
  }

  // 3. Always respond with 200 OK
  res.sendStatus(200);
});
const dbURL = process.env.DB_URI;

export function calculateTransactionFee(amount) {
  const fee = amount * 0.01; // 1%
  return fee > 250 ? 250 : fee; // cap at ₦250
}

const start = async () => {
  try {
    await connectDB(dbURL);

    server.listen(port, console.log(`Server is listening at PORT:${port}`));
  } catch (error) {
    console.log(`Couldn't connect because of ${error.message}`);
    process.exit(1);
  }
};

start();
