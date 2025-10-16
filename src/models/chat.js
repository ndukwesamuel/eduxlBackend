import mongoose from "mongoose";
const { Schema } = mongoose;
const chatSchema = new Schema({
  clan: { type: Schema.Types.ObjectId, ref: "Clan" },
  details: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      message: String,

      time: String,
    },
  ],
});

const chat = mongoose.model("chat", chatSchema);
export default chat;
