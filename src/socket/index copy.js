import express from "express";
import { Server } from "socket.io";
import http from "http";
import UserInfo from "../models/user.js";

import {
  getConversation,
  getUserDetailsFromToken,
} from "../services/Userservice.js";
import {
  ConversationModel,
  MessageModel,
} from "../models/ConversationModel.js";

// const getUserDetailsFromToken = require("../helpers/getUserDetailsFromToken");
// const UserModel = require("../models/UserModel");
// const {
//   ConversationModel,
//   MessageModel,
// } = require("../models/ConversationModel");
// const getConversation = require("../helpers/getConversation");

const app = express();

// /***socket connection */
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    // credentials : true
  },
});

// getuserProfileservice;
// /***
//  * socket running at http://localhost:8080/
//  */

// //online user
const onlineUser = new Set();

io.on("connection", async (socket) => {
  console.log("connect User ", socket.id);

  const token = socket.handshake.auth.token;

  //current user details
  const user = await getUserDetailsFromToken(token);

  console.log({
    user_id: user?.user?._id,
  });
  let user_id = user?.user?._id;
  //create a room
  socket.join(user_id.toString());
  onlineUser.add(user_id?.toString());

  io.emit("onlineUser", Array.from(onlineUser));

  socket.on("message-page", async (userId) => {
    console.log("userId", userId);
    const userDetails = await UserInfo.findById(userId).select(
      "-password -createdAt, -updatedAt, "
    );
    console.log(userDetails);
    const payload = {
      _id: userDetails?._id,
      name: userDetails?.name,
      email: userDetails?.email,
      online: onlineUser.has(userId),
    };

    socket.emit("message-user", payload);

    // const userpro
  });

  socket.on("new message", async (data) => {
    //check conversation is available both user

    let conversation = await ConversationModel.findOne({
      $or: [
        { sender: data?.sender, receiver: data?.receiver },
        { sender: data?.receiver, receiver: data?.sender },
      ],
    });

    if (!conversation) {
      const createConversation = await ConversationModel({
        sender: data?.sender,
        receiver: data?.receiver,
      });
      conversation = await createConversation.save();

      console.log({
        data,
        newconv: conversation,
      });
    }

    const message = new MessageModel({
      text: data.text,
      // imageUrl: data.imageUrl,
      // videoUrl: data.videoUrl,
      msgByUserId: data?.msgByUserId,
    });
    const saveMessage = await message.save();

    const updateConversation = await ConversationModel.updateOne(
      { _id: conversation?._id },
      {
        $push: { messages: saveMessage?._id },
      }
    );

    const getConversationMessage = await ConversationModel.findOne({
      $or: [
        { sender: data?.sender, receiver: data?.receiver },
        { sender: data?.receiver, receiver: data?.sender },
      ],
    })
      .populate("messages")
      .sort({ updatedAt: -1 });

    console.log({
      iwant_: getConversationMessage,
    });

    io.to(data?.sender).emit("message", getConversationMessage?.messages || []);
    io.to(data?.receiver).emit(
      "message",
      getConversationMessage?.messages || []
    );

    //send conversation
    const conversationSender = await getConversation(data?.sender);
    const conversationReceiver = await getConversation(data?.receiver);

    io.to(data?.sender).emit("conversation", conversationSender);
    io.to(data?.receiver).emit("conversation", conversationReceiver);
  });

  //   //disconnect
  socket.on("disconnect", () => {
    onlineUser.delete(user_id?.toString());
    console.log("disconnect user ", socket.id);
  });
});

export { app, server };
