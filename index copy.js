import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
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
import notFound from "./src/middlewares/notFound.js";
import errorMiddleware from "./src/middlewares/error.js";
import connectDB from "./src/config/connectDB.js";
import { app, server } from "./src/socket/index.js";
// import socketInitializer from "./src/socket/index";

import residentEventRouter from "./src/routes/residentEvent.js";

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
// app.use(notFound)
// app.use(errorMiddleware)

//Routes
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
app.use("/services/vendors", serviceVendorRouter);

// console.log(dbURL);
// needed for socket configuration
// const server = http.createServer(app);

// const io = new Server(server, {
//   cors: {
//     origin: ["https://pause-web.vercel.app", "http://localhost:3000"],
//     methods: ["GET", "POST"],
//   },
// });
// socketLogic(io);

const dbURL = process.env.DB_URI;

const start = async () => {
  try {
    await connectDB(dbURL);
    console.log(`DB Connected!`);
    server.listen(port, console.log(`Server is listening at PORT:${port}`));
  } catch (error) {
    console.log(`Couldn't connect because of ${error.message}`);
    process.exit(1);
  }
};

start();
