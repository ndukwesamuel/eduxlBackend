import User from "../models/user.js";
import mongoose from "mongoose";
import UserProfile from "../models/profile.js";
import { hashPassword, comparePassword } from "../helpers/auth.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { send_PushNotification_To_User } from "../services/exponotificationService.js";
import emailUtils from "../helpers/emailUtils.js";
import asyncWrapper from "../middlewares/asyncWrapper.js";
import OTP from "../models/otp.js";
import {
  findUserByEmail,
  mobile_user_loginService,
} from "../services/Userservice.js";
dotenv.config();

export const registerTestUsers = asyncWrapper(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const testUsers = [];

    // Create 5 test users
    for (let i = 1; i <= 5; i++) {
      const name = `fake${i}`;
      const email = `fake${i}@email.com`;
      const password = "123456789";

      // Check if user exists
      const existingUser = await User.findOne({ email }).session(session);
      if (existingUser) {
        console.log(`User ${email} already exists, skipping`);
        continue;
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await User.create(
        [
          {
            name,
            email,
            password: hashedPassword,
            isVerified: true, // Set verified to true
            // isAdmin: i === 1, // Make first user admin
            // roles: i === 1 ? ["user", "admin"] : ["user"], // Add admin role for first user
          },
        ],
        { session }
      );

      // Create user profile
      await UserProfile.create(
        [
          {
            user: user[0]._id,
          },
        ],
        { session }
      );

      // Create wallet
      await wallet.create(
        [
          {
            user: user[0]._id,
            balance: 0, //1000 * i, // Give each user increasing balance for testing
            currency: "NGN",
          },
        ],
        { session }
      );

      testUsers.push({
        name,
        email,
        password: "123456789", // Storing plaintext for testing (not in production!)
        userId: user[0]._id,
      });
    }

    await session.commitTransaction();

    res.status(201).json({
      message: `Created ${testUsers.length} test users`,
      users: testUsers,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Test user creation error:", error);
    res.status(500).json({
      error: "Test user creation failed",
      details: error.message,
    });
  } finally {
    session.endSession();
  }
});

export const register = asyncWrapper(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name) return res.status(400).json({ error: "Name is required" });
  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!password || password.length < 6) {
    return res.status(400).json({
      error: "Password must be at least 6 characters long",
    });
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: "Email is taken" });
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Start transaction to ensure all operations succeed or fail together
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create user
    const user = await User.create(
      [
        {
          name,
          email,
          password: hashedPassword,
        },
      ],
      { session }
    );

    // Create user profile
    await UserProfile.create(
      [
        {
          user: user[0]._id,
        },
      ],
      { session }
    );

    // Create wallet for the user
    await wallet.create(
      [
        {
          user: user[0]._id,
          balance: 0,
          currency: "NGN",
        },
      ],
      { session }
    );

    // Send OTP email
    const emailInfo = await emailUtils.sendOTPByEmail(email, name);

    // Commit transaction if all operations succeed
    await session.commitTransaction();

    res.status(201).json({
      message: `OTP has been sent to ${emailInfo.envelope.to}`,
      userId: user[0]._id,
    });
  } catch (error) {
    // Abort transaction if any operation fails
    await session.abortTransaction();
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  } finally {
    session.endSession();
  }
});

export const login = async (req, res) => {
  try {
    const { email, password, tokenNotification, mobile } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters long" });
    }

    // const user = await User.findOne({ email });
    const user = await User.findOne({ email: email.toLowerCase() });

    console.log({
      bbb: user,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Wrong password" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: "Email Not Verified" });
    }

    if (mobile) {
      user.tokens = tokenNotification;
      await user.save();

      let message_Data = {
        to: tokenNotification,
        sound: "default",
        body: "welcome to PausePoint",
        data: { withSome: "data" },
      };
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "300d",
    });

    console.log({
      dad: user,
    });

    res.json({
      message: "User logged in successfully",

      user: {
        name: user.name,
        roles: user.roles,
        id: user._id,
        admin: user.isAdmin,
        notification: user.tokens,
        token,
      },
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

export const mobile_user_login = asyncWrapper(async (req, res) => {
  let req_body = req.body;
  const mobile_user_loginServicer_resp = await mobile_user_loginService(
    req_body
  );

  res.status(201).json({
    message: "User logged in successfully",

    user: {
      mobile_user_loginServicer_resp,
      name: mobile_user_loginServicer_resp.user.name,
      roles: mobile_user_loginServicer_resp.user.roles,
      id: mobile_user_loginServicer_resp.user._id,
      notification: mobile_user_loginServicer_resp.user.tokens,
      notification: mobile_user_loginServicer_resp.user.tokens,
      clanmember: mobile_user_loginServicer_resp.user.tokens,
      clanAdmin: mobile_user_loginServicer_resp.user.tokens,
    },
    token: mobile_user_loginServicer_resp.token,
  });
});

export const secret = async (req, res) => {
  res.json({ currentUser: req.user });
};

export const forgotPassword = asyncWrapper(async (req, res) => {
  try {
    const { email } = req.body;
    const userByEmailRespons = await findUserByEmail(email);

    console.log({ userByEmailRespons });
    let name = userByEmailRespons?.name;

    const emailInfo = await emailUtils.sendOTPByEmail(email, name);

    res.status(201).json({
      message: `OTP has been sent to ${emailInfo.envelope.to}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export const Creat_New_Passowrd = asyncWrapper(async (req, res) => {
  try {
    const { email, otp, passoword: password } = req.body;
    const otpBody = await OTP.findOne({ email });
    // const otpBody = await OTP.findOne({ email, otp });
    // console.log({ otpBody });
    if (!otpBody) {
      return res.status(400).json({ message: "Invalid or Expired OTP" });
    }
    const userByEmailRespons = await findUserByEmail(email);

    const hashedPassword = await hashPassword(password);

    const user = await User.findById(userByEmailRespons._id);

    user.password = hashedPassword;
    await user.save();

    res.status(201).json({
      data: "Password Created",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    const resetToken = req.headers.authorization;

    if (!resetToken || !resetToken.startsWith("Bearer")) {
      return res.status(401).json({
        error: true,
        message: "Invalid reset token or no reset token provided",
      });
    }

    const token = resetToken.split(" ")[1];

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedToken.userId);

    if (!user) {
      return res.status(400).json({ error: "Invalid user" });
    }

    const hashedPassword = await hashPassword(newPassword);

    user.password = hashedPassword;

    await user.save();

    // Notify User about password change
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.STMP_KEY,
      },
    });

    const msg = {
      to: user.email,
      from: process.env.EMAIL_FROM,
      subject: "Password Reset",
      html: `<h2 style="color: green; border: 2px solid green; border-radius: 15px; padding: 10px">Hello, ${user.name}</h2></br><p style="color: black; background-color: yellow; padding: 15px">Your password has been changed!</p>`,
    };

    await transporter.sendMail(msg);

    res.json({ message: "Password successfully reset" });
  } catch (error) {
    console.error(error);
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Token expired" });
    }
    return res.status(500).json({ error: "Server error" });
  }
};

export const updateUserpushtoken = async (req, res) => {
  const { pushtoken } = req.body;
  let user = req.user._id;

  const profile = await UserProfile.findOne({ user: user });

  // await User.findByIdAndUpdate(
  //   user,
  //   { name: name, email: email },
  //   {
  //     new: true,
  //   }
  // );
  res.json({ currentUser: profile, pushtoken });
};

export const updateUser = async (req, res) => {
  const { _id } = req.user;

  const { gender, phone } = req.body;
  const imageFile = req.file;

  console.log({
    q: req.body,
  });
  res.json({ currentUser: _id });
};

export const ChangePassword = async (req, res) => {
  const User_id = req.user._id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: " Old password, and new password are required" });
  }

  // Find the user by email
  const user = await User.findOne({ _id: User_id });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Compare old password with the stored hashed password

  const isPasswordMatch = await comparePassword(oldPassword, user.password);

  if (!isPasswordMatch) {
    return res.status(401).json({ error: "Invalid old password" });
  }

  // const hashedPassword = await bcrypt.hash(newPassword, 10);

  const hashedPassword = await hashPassword(newPassword);

  // Update the user's password
  user.password = hashedPassword;
  await user.save();
  try {
    res.json({ message: "Password successfully reset" });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
};

export const sendOTP = asyncWrapper(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  // Avoid sending another email
  if (user.isVerified) {
    return res.status(200).json({ message: "User Already Verified" });
  }
  const emailInfo = await emailUtils.sendOTPByEmail(email, user.userName);
  res.status(201).json({
    message: `OTP has been sent to ${emailInfo.envelope.to}`,
  });
});

export const verifyOTP = asyncWrapper(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (user.isVerified) {
    return res.status(200).json({ message: "User Already Verified" });
  }

  const otpBody = await OTP.findOne({ email, otp });

  if (!otpBody) {
    return res.status(400).json({ message: "Invalid or Expired OTP" });
  }

  await User.findOneAndUpdate({ _id: user._id }, { isVerified: true });
  res.status(200).json({ message: "Profile Verified" });
});

export const deleteAccount = asyncWrapper(async (req, res, next) => {
  try {
    // const { userId } = req.params;

    let userId = req.user._id;
    // Retrieve the current user data
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    // Keep part of the original email and name
    const emailPrefix = user.email.split("@")[0];
    const anonymizedEmail = `${emailPrefix}_deleted@example.com`;
    const anonymizedName = `${user.name} (Deleted)`;

    // Update the user record
    await User.findByIdAndUpdate(
      userId,
      {
        email: anonymizedEmail,
        password: "123456789".repeat(2), // Simplified password
        name: anonymizedName,
        isVerified: false,
        isActive: false,
      },
      { new: true }
    );

    res.status(200).json({ user, message: "Account deactivated successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error while deactivated successfully" });
  }
});

import semver from "semver";

export const AdminVersion = asyncWrapper(async (req, res, next) => {
  try {
    const clientVersion = req.query.version;
    const versionInfo = await Version.findOne(); // Get the latest version
    if (!versionInfo) {
      return res.status(404).json({ message: "Version info not found" });
    }
    const needsUpdate = clientVersion < versionInfo.minRequiredVersion;

    const shouldForce = needsUpdate && versionInfo.forceUpdate;

    res.json({
      clientVersion,
      needsUpdate,
      forceUpdate: shouldForce,
      currentVersion: versionInfo.currentVersion,
      message: versionInfo.updateMessage,
    });
  } catch (error) {
    res.status(400).json({ message: "Error while deactivated successfully" });
  }
});

import Version from "../models/version.js";
import wallet from "../models/wallet.js";

export const updateVersion = asyncWrapper(async (req, res) => {
  try {
    const { currentVersion, minRequiredVersion, updateMessage, forceUpdate } =
      req.body;

    let versionInfo = await Version.findOne();

    if (!versionInfo) {
      versionInfo = new Version();
    }

    versionInfo.currentVersion = currentVersion;
    versionInfo.minRequiredVersion = minRequiredVersion;
    versionInfo.updateMessage = updateMessage;
    versionInfo.forceUpdate = forceUpdate;

    await versionInfo.save();

    res.json({ message: "Version info updated successfully", versionInfo });
  } catch (error) {
    res.status(500).json({ message: "Error updating version info" });
  }
});
