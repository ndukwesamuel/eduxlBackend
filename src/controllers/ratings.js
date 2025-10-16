import { calculateAverageRating } from "../helpers/ratings.js";
import Rating from "../models/ratings.js";

export const addOrUpdateRating = async (req, res) => {
  try {
    const { star } = req.body;
    const userId = req.user._id;

    // Check if the star rating is a number between 1 and 5
    if (!Number.isInteger(star) || star < 1 || star > 5) {
      return res.status(400).json({
        success: false,
        message: "Star rating must be a number between 1 and 5",
      });
    }

    const existingRating = await Rating.findOne({ "ratings.postedBy": userId });

    if (existingRating) {
      const userRating = existingRating.ratings
        .find((rating) => rating.postedBy.toString() === userId.toString())
        .sort({ createdAt: -1 });
      userRating.star = star;
      await existingRating.save();

      const ratedUsersCount = await Rating.countDocuments({
        "ratings.star": { $exists: true },
      });
      const avgRating = await calculateAverageRating();
      res.json({
        message: "Rating updated successfully",
        data: existingRating,
        ratedUsersCount,
        avgRating,
      });
    } else {
      const newRating = new Rating({
        ratings: [{ star, postedBy: userId }],
      });
      await newRating.save();

      const ratedUsersCount = await Rating.countDocuments({
        "ratings.star": { $exists: true },
      });
      const avgRating = await calculateAverageRating();
      res.status(201).json({
        message: "Rating added successfully",
        data: newRating,
        ratedUsersCount,
        avgRating,
      });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to add/update rating", errorMsg: error.message });
  }
};

export const getAllRatings = async (req, res) => {
  try {
    const ratings = await Rating.find()
      .populate({
        path: "ratings.postedBy",
        select: "name",
      })
      .sort("-createdAt");

    const ratedUsersCount = await Rating.countDocuments({
      "ratings.star": { $exists: true },
    });

    let sumOfStars = 0;
    ratings.forEach((rating) => {
      rating.ratings.forEach((userRating) => {
        sumOfStars += userRating.star;
      });
    });

    res.json({
      message: "All ratings fetched successfully",
      data: ratings,
      ratedUsersCount,
      sumOfStars,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to fetch ratings", errorMsg: error.message });
  }
};

export const deleteRating = async (req, res) => {
  try {
    const { ratingId } = req.params;

    const deletedRating = await Rating.findByIdAndDelete(ratingId);

    if (!deletedRating) {
      return res
        .status(404)
        .json({ success: false, message: "Rating not found" });
    }

    res.json({ success: true, message: "Rating deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to delete rating", errorMsg: error.message });
  }
};
