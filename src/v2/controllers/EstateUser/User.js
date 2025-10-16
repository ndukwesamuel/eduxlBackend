// import { sendPushNotifications } from "../../../services/PushnotificationSevice.js";
import User from "../../../models/user.js";
import UserProfile from "../../../models/profile.js";
import jwt from "jsonwebtoken";

import {
  sendBulkNotifications,
  sendNotification,
} from "../../../services/PushnotificationSevice.js";
import { hashPassword, comparePassword } from "../../../helpers/auth.js";
import {
  findUserByEmail,
  getRecipientsByEmails,
} from "../../../services/Userservice.js";
import Clan from "../../../models/clan.js";
import mongoose from "mongoose";
import wallet from "../../../models/wallet.js";
import asyncWrapper from "../../../middlewares/asyncWrapper.js";
import emailUtils from "../../../helpers/emailUtils.js";

export const PushNotification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, body, data, pushTokens } = req.body;

    // // Validate request
    // if (!title || !body) {
    //   return res.status(400).json({
    //     success: false,
    //     error: "Notification title and body are required.",
    //   });
    // }

    // Find user and check if they have a push token
    // const userProfile = await UserProfile.findOne({ user: userId });

    // if (!userProfile) {
    //   return res.status(404).json({
    //     success: false,
    //     error: "User profile not found.",
    //   });
    // }

    // if (!userProfile.pushToken) {
    //   return res.status(400).json({
    //     success: false,
    //     error: "User doesn't have a registered push token.",
    //   });
    // }

    // Send the notification
    let token = pushTokens; ///  "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"; // Replace with actual token
    const tickets = await sendNotification(
      //   userProfile.pushToken,
      token,
      title,
      body,
      data
    );

    return res.status(200).json({
      success: true,
      message: "Notification sent successfully",
      tickets,
    });
  } catch (error) {
    console.error("Error sending user notification:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, pushToken } = req.body;

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

    // Update push token if provided
    // Find or create user profile
    let userProfile = await UserProfile.findOne({ user: user._id });

    if (!userProfile) {
      userProfile = new UserProfile({ user: user._id });
    }

    // Update push token
    userProfile.pushtoken = pushToken;
    let newpro = await userProfile.save();

    // Send welcome notification

    // Uncomment to actually send the notification
    // await sendPushNotification(messageData);

    let tokedata = [newpro?.pushtoken]; // pushToken; ///  "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"; // Replace with actual token
    let title = "PausePoint";
    let body = "You've successfully logged in";
    let datas = {};

    const tickets = await sendNotification(tokedata, title, body, datas);

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
        notification: UserProfile.pushtoken,
        email: user.email,
        isGuest: user.isGuest,
      },
      token,
      tickets,
      pushToken,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

export const will_work_on_ater_BulkTestPushwithMail = async (req, res) => {
  try {
    const profiles = await UserProfile.find({
      currentClanMeeting: { $exists: true, $ne: null },
    })
      .populate({
        path: "user",
        match: { tokens: { $exists: true, $ne: null } }, // Only populate users who have tokens
      })
      .populate("currentClanMeeting");

    // Filter out profiles where user is null (due to the match condition)
    const filteredProfiles = profiles.filter(
      (profile) => profile.user !== null
    );

    res.status(200).json(filteredProfiles);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const TestPushwithMail = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Input validation
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // 2. Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // 3. Find user profile
    const userProfile = await UserProfile.findOne({ user: user._id });

    let recipients = [
      {
        id: "user123",
        pushToken: "ExponentPushToken[qbvfMlHiCP5YrdjwM9G4xv]",
      },
    ];

    let title = "title";
    let body = "we moive";
    let data = {};

    const tickets = await sendBulkNotifications(
      //   userProfile.pushToken,
      recipients,
      title,
      body,
      data
    );

    return res.status(200).json({
      success: true,
      recipients,
      tickets,
      // user,
      // userProfile,
    });
  } catch (error) {
    console.error("Error in TestPushwithMail:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      // stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

export const BulkTestPushwithMail = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Input validation
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // 2. Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // 3. Find user profile
    // const userProfile = await UserProfile.findOne({ user: user._id });

    let recipients = [
      {
        id: "user123",
        pushToken: "ExponentPushToken[qbvfMlHiCP5YrdjwM9G4xv]",
      },
    ];

    let title = "title";
    let body = "we moive";
    let data = {};

    const tickets = await sendBulkNotifications(
      //   userProfile.pushToken,
      recipients,
      title,
      body,
      data
    );

    return res.status(200).json({
      success: true,
      recipients,
      tickets,
      // user,
      // userProfile,
    });
  } catch (error) {
    console.error("Error in TestPushwithMail:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      // stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

export const Fakwe = async (req, res) => {
  try {
    const wallet_data = await wallet.findOne({
      user: "67fe7602ff5d9e29a8f31baf",
    });

    wallet_data.balance = 30000; // Update balance to 30,000 Naira
    await wallet_data.save();
    // 3. Find user profile

    res.json({
      success: true,
      message: "Wallet balance updated to 30,000 successfully",
      balance: wallet_data,
    });
  } catch (error) {
    console.error("Error in TestPushwithMail:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      // stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

export const updateProfileInfo = async (req, res) => {
  try {
    const { user, clan, body: updates } = req;
    const userId = user._id;

    // Initialize response object
    const response = {
      success: true,
      message: "Profile updated successfully",
      updates: {
        user: false,
        profile: false,
        clanMember: false,
      },
      updatedData: {},
    };

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Update User name if provided
      if (updates.name) {
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { name: updates.name },
          { new: true, session }
        );
        response.updates.user = true;
        response.updatedData.user = { name: updatedUser.name };
      }

      // 2. Prepare profile updates (excluding name)
      const { name, ...profileUpdates } = updates;

      // 3. Update UserProfile
      const updatedProfile = await UserProfile.findOneAndUpdate(
        { user: userId },
        { $set: profileUpdates },
        {
          new: true,
          runValidators: true,
          session,
        }
      ).populate("user", "name email");

      if (updatedProfile) {
        response.updates.profile = true;
        response.updatedData.profile = updatedProfile;
      }

      // 4. Update Clan member data if allowed
      if (clan?.settings?.allowMembersToEditProfile) {
        const clanUpdateResult = await updateClanMemberData(
          clan._id,
          userId,
          updates,
          session
        );
        if (clanUpdateResult) {
          response.updates.clanMember = true;
          response.updatedData.clanMember = clanUpdateResult;
        }
      }

      // Commit transaction
      await session.commitTransaction();

      res.status(200).json(response);
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

// Enhanced helper function to update clan member data
const updateClanMemberData = async (clanId, userId, updates, session) => {
  const clan = await Clan.findById(clanId).session(session);
  const member = clan.members.find(
    (m) => m.user.toString() === userId.toString()
  );

  if (!member) return null;

  const memberUpdates = {
    "members.$.phonenumber": updates.phoneNumber || member.phonenumber,
    "members.$.houseNumber": updates.houseNumber || member.houseNumber,
    "members.$.street": updates.street || member.street,
    "members.$.apartmentType": updates.apartmentType || member.apartmentType,
    "members.$.unitNumber": updates.unitNumber || member.unitNumber,
  };

  const updateResult = await Clan.findOneAndUpdate(
    { _id: clanId, "members.user": userId },
    { $set: memberUpdates },
    {
      new: true,
      session,
      projection: { members: { $elemMatch: { user: userId } } },
    }
  );

  if (!updateResult) return null;

  // Return the updated member data
  return updateResult.members[0];
};

export const SendNotificationToDev = async (req, res) => {
  try {
    const recipients = await getRecipientsByEmails();
    res.status(200).json({ recipients });
  } catch (error) {
    console.error("Error in SendNotificationToDev:", error);
    res.status(500).json({
      error: error.message || "Internal server error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
