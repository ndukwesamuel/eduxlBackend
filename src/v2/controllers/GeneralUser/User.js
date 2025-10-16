import Errand from "../../../models/errand.js";
import { processItemImages } from "../../utils/processItemImages.js";
import { validateErrandData } from "../../utils/errandValidator.js";
import mongoose from "mongoose";
import TransactionHistory from "../../../models/TransactionHistory.js";
import User from "../../../models/user.js";
import user from "../../../models/user.js";
import { hashPassword } from "../../../helpers/auth.js";
import { getRecipientsByEmails } from "../../../services/Userservice.js";
// cloudinary
import slugify from "slugify";

import { v2 as cloudinary } from "cloudinary";
import walletdata from "../../../models/wallet.js"; //"../../../models/wallet.js";
import UserProfile from "../../../models/profile.js";

export const UpdateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id; // assuming you use auth middleware and req.user is available
    const { name, phoneNumber, address } = req.body;

    // Check if user exists and is a guest
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isGuest) {
      return res
        .status(403)
        .json({ message: "Only guest users can perform this action" });
    }

    // Update allowed fields
    if (name) {
      user.name = name;
      await user.save();
    }

    const userProfile = await UserProfile.findOne({ user: userId });
    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    if (phoneNumber) {
      userProfile.phoneNumber = phoneNumber;
    }

    if (address) {
      userProfile.address = {
        ...userProfile.address.toObject(),
        ...address,
      };
    }

    await userProfile.save();

    return res.json({
      message: "Guest profile updated successfully",
      //   user,
      user: {
        name: user.name,
        phoneNumber: userProfile.phoneNumber,
        address: userProfile.address,
      },
    });
  } catch (error) {
    console.error("Error updating guest profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const GetUserProfile = async (req, res) => {
  try {
    const userId = req.user._id; // assuming you use auth middleware and req.user is available

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userProfile = await UserProfile.findOne({ user: userId });
    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    return res.json({
      message: "User profile fetched successfully",
      user: {
        name: user.name,
        phoneNumber: userProfile.phoneNumber,
        address: userProfile.address,
        photo: userProfile.photo,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateProfileImage = async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const imageFile = req.files.image;

    // Find the user's profile
    const profile = await UserProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    // Delete old image from Cloudinary if it exists
    if (profile.photoPublicId) {
      await cloudinary.uploader.destroy(profile.photoPublicId);
    }

    // Upload new image to Cloudinary (using tempFilePath from express-fileupload)
    const result = await cloudinary.uploader.upload(imageFile.tempFilePath, {
      folder: "user_profiles",
    });

    // Update profile with new image URL and publicId
    profile.photo = result.secure_url;
    profile.photoPublicId = result.public_id;
    await profile.save();

    res.status(200).json({
      message: "Profile image updated successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
