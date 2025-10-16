import UserProfile from "../models/profile.js";
import User from "../models/user.js";
// import { cloudinary } from "../helpers/cloudinaryConfig.js";

// cloudinary
import slugify from "slugify";

import { v2 as cloudinary } from "cloudinary";

// Configure cloudinary - add this at the beginning of your file
cloudinary.config({
  cloud_name: "dkzds0azx", // process.env.CLOUDINARY_CLOUD_NAME,
  api_key: "617445194715168", //process.env.CLOUDINARY_API_KEY,
  api_secret: "fMHpeO7b71XuQEDRB9_idWRR3Qk", // process.env.CLOUDINARY_API_SECRET,
});

const createProfile = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    const imageFile = req.file;

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingProfile = await UserProfile.findOne({
      user: existingUser._id,
    });

    if (existingProfile) {
      return res.status(400).json({ error: "Profile already exists" });
    }

    const newProfile = new UserProfile({
      user: existingUser._id,
      phoneNumber,
    });

    if (imageFile) {
      const imageResult = await cloudinary.uploader.upload(imageFile.path);
      newProfile.photo = imageResult.secure_url;
      newProfile.photoPublicId = imageResult.public_id;
    }

    const savedProfile = await newProfile.save();
    res.status(201).json(savedProfile);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to create profile", errorMsg: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    let id = req.user._id;
    console.log({
      id,
    });

    // console.log({ ssss: id });
    const profile = await UserProfile.findOne({ user: id })
      .populate({
        path: "user",
        select: ["-password", "-isAdmin", "-isVendor", "-__v"],
      })
      .populate("currentClanMeeting");

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(profile);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to get profile", errorMsg: error.message });
  }
};

// const updateProfile = async (req, res) => {
//   try {
//     const { phoneNumber, name,gender } = req.body;
//     const imageFile = req.files?.photo; // assuming the file field is named 'photo'
//     const user_id = req.user._id;

//     const updates = {};

//     // Only add fields that are provided
//     if (name) updates.name = name;
//     if (phoneNumber) updates.phoneNumber = phoneNumber;
//     const currentUser = await UserProfile.findOne({ user: user_id });

//     if (!currentUser) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Handle image upload if provided
//     if (imageFile) {
//       console.log({
//         ddd: currentUser,
//       });

//       const imageResult = await cloudinary.uploader.upload(file.tempFilePath, {
//         resource_type: "auto",
//         folder: "profile",
//       });
//     }

//     res.json({
//       message: "User Profile updated successfully",
//       imageFile,
//       currentUser,
//       // userProfile,
//     });
//   } catch (err) {
//     console.log(err);
//     res
//       .status(500)
//       .json({ error: "Failed to update user profile", errorMsg: err.message });
//   }
// };

const updateProfile = async (req, res) => {
  try {
    const { phoneNumber, name } = req.body;
    const imageFile = req.files?.photo; // assuming single file upload with field name 'photo'
    const user_id = req.user._id;

    // Find the current user profile
    const currentUser = await UserProfile.findOne({ user: user_id });
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates = {};

    // Only update fields that are provided
    if (name) updates.name = name;
    if (phoneNumber) updates.phoneNumber = phoneNumber;

    // Handle image upload if provided
    if (imageFile) {
      // Delete old image if exists
      if (currentUser.photoPublicId) {
        await cloudinary.uploader.destroy(currentUser.photoPublicId);
      }

      // Upload new image
      const imageResult = await cloudinary.uploader.upload(
        imageFile.tempFilePath,
        {
          resource_type: "auto",
          folder: "profile",
        }
      );

      updates.photo = imageResult.secure_url;
      updates.photoPublicId = imageResult.public_id;
    }

    // Update the user profile
    const updatedProfile = await UserProfile.findOneAndUpdate(
      { user: user_id },
      { $set: updates },
      { new: true }
    );

    res.json({
      message: "Profile updated successfully",
      userProfile: updatedProfile,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({
      error: "Failed to update profile",
      errorMsg: err.message,
    });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const { _id } = req.params;
    const deletedProfile = await UserProfile.findOneAndDelete({ _id });

    // Delete photo from cloudinary
    if (deleteProfile.photoPublicId) {
      await cloudinary.uploader.destroy(deleteProfile.photoPublicId);
    }

    if (!deletedProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    res.json({
      message: "Profile deleted successfully",
      deletedProfile,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete profile", errorMsg: error.message });
  }
};

export { createProfile, getProfile, updateProfile, deleteProfile };
