import mongoose from "mongoose";

const { Schema } = mongoose;

const ratingSchema = new Schema(
  {
    ratings: [
      {
        star: Number,
        postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    avgRating: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Ratings", ratingSchema);
