import User from "../models/user.js";
import UserProfile from "../models/profile.js";
import bcrypt from "bcrypt";
import { cloudinary } from "../helpers/cloudinaryConfig.js";
import { send_PushNotification_To_User } from "../services/exponotificationService.js";

const getAllUsers = async (req, res) => {
  try {
    const user_id = req.user._id;
    const clan = req.clan;
    const users = await User.find({
      clan: clan._id,
    })
      .select("-password")
      .sort({ createdAt: -1 });

    // let message_Data = {
    //   to: "ExponentPushToken[TZmRRTGdOUMyGqNGWHKfNb]",
    //   sound: "default",
    //   body: "This is a test notification and we love it",
    //   data: { withSome: "data" },
    // };

    // const expo_notification_response = await send_PushNotification_To_User(
    //   message_Data
    // );

    res.json({ users, user_id, clan, len: users.length });
  } catch (err) {
    res.status(500).json({ error: "failed to fetch users", errorMsg: err });
  }
};

const getOneUser = async (req, res) => {
  try {
    const { _id } = req.params;

    const user = await UserProfile.findOne({ user: _id }).populate({
      path: "user",
      select: "-password",
    });

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to retrieve user", errorMsg: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { _id } = req.params;
    const { name, password, address } = req.body;
    const imageFile = req.file;

    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    if (password && password.length < 6) {
      return res.status(400).json({
        error: "Password is required and should be min 6 characters long",
      });
    }

    const updateUserData = {
      name: name || user.name,
      address: address || user.address,
    };

    if (password) {
      const hashedPassword = password
        ? await hashPassword(password)
        : undefined;
      updateUserData.password = hashedPassword;
    }

    if (imageFile) {
      if (user.photo && user.photoPublicId) {
        await cloudinary.uploader.destroy(user.photoPublicId);
      }
      const imageResult = await cloudinary.uploader.upload(imageFile.path);
      updateUserData.photo = imageResult.secure_url;
      updateUserData.photoPublicId = imageResult.public_id;
    }

    const updatedUser = await User.findByIdAndUpdate(_id, updateUserData, {
      new: true,
    });

    return res.json({
      message: "User Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ error: "Failed to update user profile", errorMsg: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { _id } = req.params;
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.photoPublicId) {
      await cloudinary.uploader.destroy(user.photoPublicId);
    }

    await User.findByIdAndDelete(_id);

    return res.json({ message: `User ${user.name} deleted successfully` });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ error: "Failed to delete user", errorMsg: err.message });
  }
};

const updateUserRoles = async (req, res) => {
  try {
    const { _id } = req.params;
    const { role } = req.body;

    const updateQuery =
      role === "admin"
        ? { $addToSet: { roles: role }, isAdmin: true }
        : { $addToSet: { roles: role } };

    const updatedUser = await User.findByIdAndUpdate(_id, updateQuery, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    updatedUser.password = undefined;
    res.json({ message: "User role updated successfully", user: updatedUser });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ error: "Failed to update user role", errorMsg: err.message });
  }
};

const removeUserRole = async (req, res) => {
  try {
    const { _id } = req.params;
    const { role } = req.body;

    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.roles.includes(role)) {
      return res.status(400).json({ error: "Role not found for this user" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { $pull: { roles: role } },
      { new: true }
    );

    updatedUser.password = undefined;
    res.json(updatedUser);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ error: "Failed to remove user role", errorMsg: err.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { _id } = req.params;
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Toggle the value of isActive
    user.isActive = !user.isActive;

    const updatedUser = await user.save();

    updatedUser.password = undefined;

    res.json(updatedUser);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ error: "Failed to toggle user status", errorMsg: err.message });
  }
};

export {
  getAllUsers,
  getOneUser,
  updateUser,
  deleteUser,
  updateUserRoles,
  removeUserRole,
  toggleUserStatus,
};
