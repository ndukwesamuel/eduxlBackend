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

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const onlineUser = new Set();

io.on("connection", async (socket) => {
  console.log("connect User ", socket.id);

  const token = socket.handshake.auth.token;

  try {
    // current user details
    const user = await getUserDetailsFromToken(token);

    if (!user || !user.user || !user.user._id) {
      throw new Error("Invalid user data");
    }

    const user_id = user.user._id.toString();

    // create a room
    socket.join(user_id);
    onlineUser.add(user_id);

    io.emit("onlineUser", Array.from(onlineUser));

    socket.on("message-page", async (userId) => {
      try {
        console.log("userId", userId);
        const userDetails = await UserInfo.findById(userId).select(
          "-password -createdAt -updatedAt"
        );
        if (!userDetails) {
          throw new Error("User not found");
        }
        const payload = {
          _id: userDetails._id,
          name: userDetails.name,
          email: userDetails.email,
          online: onlineUser.has(userId),
        };

        socket.emit("message-user", payload);
      } catch (err) {
        console.error("Error in message-page event:", err);
        socket.emit("error", "Failed to load user details");
      }
    });

    socket.on("new message", async (data) => {
      try {
        let conversation = await ConversationModel.findOne({
          $or: [
            { sender: data.sender, receiver: data.receiver },
            { sender: data.receiver, receiver: data.sender },
          ],
        });

        if (!conversation) {
          const createConversation = new ConversationModel({
            sender: data.sender,
            receiver: data.receiver,
          });
          conversation = await createConversation.save();
        }

        const message = new MessageModel({
          text: data.text,
          msgByUserId: data.msgByUserId,
        });
        const saveMessage = await message.save();

        await ConversationModel.updateOne(
          { _id: conversation._id },
          {
            $push: { messages: saveMessage._id },
          }
        );

        const getConversationMessage = await ConversationModel.findOne({
          $or: [
            { sender: data.sender, receiver: data.receiver },
            { sender: data.receiver, receiver: data.sender },
          ],
        })
          .populate("messages")
          .sort({ updatedAt: -1 });

        io.to(data.sender).emit(
          "message",
          getConversationMessage?.messages || []
        );
        io.to(data.receiver).emit(
          "message",
          getConversationMessage?.messages || []
        );

        const conversationSender = await getConversation(data.sender);
        const conversationReceiver = await getConversation(data.receiver);

        io.to(data.sender).emit("conversation", conversationSender);
        io.to(data.receiver).emit("conversation", conversationReceiver);
      } catch (err) {
        console.error("Error in new message event:", err);
        socket.emit("error", "Failed to send message");
      }
    });

    socket.on("fetch-conversation", async (data) => {
      try {
        const getConversationMessage = await ConversationModel.findOne({
          $or: [
            { sender: data.sender, receiver: data.receiver },
            { sender: data.receiver, receiver: data.sender },
          ],
        })
          .populate("messages")
          .sort({ updatedAt: -1 });

        socket.emit(
          "conversation-history",
          getConversationMessage?.messages || []
        );
      } catch (err) {
        console.error("Error in fetch-conversation event:", err);
        socket.emit("error", "Failed to fetch conversation");
      }
    });

    socket.on("disconnect", () => {
      onlineUser.delete(user_id);
      console.log("disconnect user ", socket.id);
    });
  } catch (err) {
    console.error("Error during socket connection:", err);
    socket.emit("error", "Connection failed");
  }
});

export { app, server };
