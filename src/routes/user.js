import express from "express";
import {
  getAllUsers,
  getOneUser,
  updateUser,
  deleteUser,
  updateUserRoles,
  removeUserRole,
  toggleUserStatus,
} from "../controllers/user.js";
import { isAdmin, requireSignin } from "../middlewares/auth.js";
import upload from "../helpers/multer.js";
import {
  checkClan_IsApproved_and_MemberApproved_Admin,
  checkClan_IsAproved_and_MemberAproved_noParams,
} from "../middlewares/clan.js";

import User from "../models/user.js";
const router = express.Router();

router.get("/", async (req, res) => {
  res.status(200).json({ result: "this is my na e" });
});

router.get("/users", requireSignin, getAllUsers);

// New route to search users by email or name
router.get("/users/search", async (req, res) => {
  try {
    const { search } = req.query; // Get the search query from the request

    if (!search) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Use a regex to search for users by email or name
    const users = await User.find({
      $or: [
        { email: { $regex: search, $options: "i" } }, // Case-insensitive search for email
        { name: { $regex: search, $options: "i" } }, // Case-insensitive search for name
      ],
    }).select("-password"); // Exclude the password field from the results

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/user/change-email/:_id", async (req, res) => {
  try {
    const { _id } = req.params; // Get the user ID from the URL params
    const { newEmail } = req.body; // Get the new email from the request body

    if (!newEmail) {
      return res.status(400).json({ message: "New email is required" });
    }

    // Validate the new email format
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ message: "Please provide a valid email" });
    }

    // Check if the new email is already in use
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    // Update the user's email
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { email: newEmail },
      { new: true } // Return the updated user
    ).select("-password"); // Exclude the password field from the response

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error changing email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// router.get("/users", getAllUsers);

router
  .route("/users")
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    getAllUsers
  );

router.get("/user/:_id", requireSignin, getOneUser);
router.put("/user/:_id", requireSignin, upload.single("photo"), updateUser);
router.delete("/user/:_id", upload.single("photo"), deleteUser);
router.put("/update-role/:_id", requireSignin, isAdmin, updateUserRoles);
router.put("/remove-role/:_id", requireSignin, isAdmin, removeUserRole);
router.put("/toggle-status/:_id", requireSignin, isAdmin, toggleUserStatus);

export default router;
