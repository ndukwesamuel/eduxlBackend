import VendorRating from "../models/vendorRating.js";
import ServiceVendor from "../models/serviceVendor.js";
import { calcAvgRating } from "../helpers/ratings.js";

export const rateVendor = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const { vendorId } = req.params;
    const userId = req.user._id;

    if (!userId || !vendorId) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid userId or vendorId" });
    }
    if (!rating) {
      return res
        .status(400)
        .json({ success: false, message: "Rating is required" });
    }

    // Check if the star rating is a number between 1 and 5
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be a number between 1 and 5" });
      }

    // Check if the user has already rated the vendor
    let existingRating = await VendorRating.findOne({
      user: userId,
      vendor: vendorId,
    });

    if (existingRating) {
      existingRating.rating = rating || existingRating.rating;
      existingRating.review = review || existingRating.review;
      await existingRating.save();
      const p = await ServiceVendor.findById(vendorId).populate("ratings");
      p.avgRating = await calcAvgRating(p);
      await p.save();
    } else {
      const newRating = new VendorRating({
        user: userId,
        vendor: vendorId,
        rating,
        review,
      });
      await newRating.save();

      await ServiceVendor.findByIdAndUpdate(vendorId, {
        $push: { ratings: newRating._id },
      });

      // Calculate the average rating for the product
      let vendor = await ServiceVendor.findById(vendorId).populate("ratings");
      vendor.avgRating = await calcAvgRating(vendor);
      await vendor.save();
      // console.log(vendor);
    }

    const ratedVendor = await ServiceVendor.findById(vendorId);

    return res.status(201).json({
      success: true,
      message: "Vendor rated successfully",
      rating,
      avgRating: ratedVendor.avgRating,
      review,
    });
  } catch (err) {
    console.error("Error rating vendor:", err.message);
    res.status(500).json({
      success: false,
      message: "Failed to rate vendor",
      error: err.message,
    });
  }
};

export const getAllRatingsOfAVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const ratings = await VendorRating.find({ vendor: vendorId })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'vendor',
        select: 'avgRating',
      });

    const totalRatingCount = await VendorRating.countDocuments({ vendor: vendorId });

    const totalPages = Math.ceil(totalRatingCount / limit);

    return res.status(200).json({
      success: true,
      totalPages,
      ratingCount: totalRatingCount,
      ratings,
    });
  } catch (error) {
    console.error("Error fetching ratings:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch ratings", error: error.message });
  }
};



export const getVendorRatingById = async (req, res) => {
  try {
    const { ratingId } = req.params;
    
    const rating = await VendorRating.findById(ratingId).populate('user', 'username'); 
    
    if (!rating) {
      return res.status(404).json({ success: false, message: "Rating not found" });
    }

    return res.status(200).json({ success: true, rating });
  } catch (error) {
    console.error("Error fetching rating:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch rating", error: error.message });
  }
};



export const deleteVendorRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    
    const deletedRating = await VendorRating.findByIdAndDelete(ratingId);
    
    if (!deletedRating) {
      return res.status(404).json({ success: false, message: "Rating not found" });
    }

    return res.status(200).json({ success: true, message: `Rating ${ratingId} deleted successfully` });
  } catch (error) {
    console.error("Error deleting rating:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete rating", error: error.message });
  }
};
