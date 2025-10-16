import Chat from "../models/chat.js";

export const socketLogic = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("join_room", (data) => {
      // The data should contain the clanId and the userId
      socket.join(data);
      console.log(`User with Id: ${socket.id} joined room ${data}`);
    });
    // The send_message data should contain the details of the user, the message and time
    socket.on("send_message", async (data) => {
      try {
        if (socket.connected) {
          await socket.to(data.clanId).emit("receive_message", data);
          console.log("incoming data", data);
          const chatRoomExist = await Chat.findOne({ clan: data.clanId });

          if (chatRoomExist) {
            await Chat.updateOne(
              { clan: data.clanId },
              {
                $push: {
                  details: {
                    user: data.userId,
                    message: data.message,
                    time: data.time,
                  },
                },
              }
            );
          } else {
            const newMessage = new Chat({
              clan: data.clanId,
              details: [
                {
                  username: data.userId,
                  message: data.message,
                  time: data.time,
                },
              ],
            });
            await newMessage.save();
          }
        }
      } catch (error) {
        console.error("Error emitting message:", error);
        socket.emit("error", { message: "Internal server error" });
      }
    });
    socket.on("get_messages", async (clanId) => {
      try {
        //send the clanId from the req.
        const chatRoomInfo = await Chat.findOne({ clan: clanId });
        if (!chatRoomInfo) {
          return socket.emit("error", { message: "Room not found" });
        }
        socket.emit("messages", chatRoomInfo.details);
        // console.log("details", chatRoomInfo.details);
      } catch (error) {
        console.error("Error emitting message coming from Db:", error);
        socket.emit("error", { message: "Internal server error" });
      }
    });
    socket.on("disconnect", () => {
      console.log("User disconnected", socket.id);
    });
  });
};
