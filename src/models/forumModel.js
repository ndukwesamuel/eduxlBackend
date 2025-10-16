import mongoose from "mongoose";

const forumSchema = new mongoose.Schema(
  {
    content: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "UserProfile" },
    clan: { type: mongoose.Schema.Types.ObjectId, ref: "Clan" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content: String,
        isAdmin: { type: Boolean, default: false },
        replies: [
          {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            content: String,
            isAdmin: { type: Boolean, default: false },
          },
        ],
      },
    ],
    announcement: { type: Boolean, default: false }, // Add this line
  },
  { timestamps: true }
);

const forumModel = mongoose.model("forumModel", forumSchema);
export default forumModel;
