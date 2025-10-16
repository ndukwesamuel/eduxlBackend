import { Expo } from "expo-server-sdk";
import forumModel from "../models/forumModel.js";
import UserProfile from "../models/profile.js";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import { ConversationModel } from "../models/ConversationModel.js";
import { customError } from "../utils/customError.js";
import { comparePassword } from "../helpers/auth.js";
import { send_PushNotification_To_User } from "./exponotificationService.js";
import { sendBulkNotifications } from "./PushnotificationSevice.js";
let expo = new Expo({
  // accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: false, // this can be set to true in order to use the FCM v1 API
});

const mobile_user_loginService = async (req_body) => {
  const { email, password, tokenNotification, mobile } = req_body;
  const user = await findUserByEmail(email);
  let user_password = user.password;
  await validatePassword(password, user_password);

  if (!user.isVerified) {
    // return res.status(401).json({ message: "Email Not Verified" });
    throw customError(400, "Email Not Verified");
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

    const expo_notification_response = await send_PushNotification_To_User(
      message_Data
    );
  }

  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "300d",
  });

  let user_id = user.id;

  const userrespons = await swithcFromadmin_user(user_id);
  console.log({ userrespons });

  return { user, token };
};

const findUserByEmail = async (email) => {
  if (!email) {
    throw customError(400, "Please provide an email");
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw customError(401, "No User with this Email");
  }
  return user;
};

const validatePassword = async (password, user_password) => {
  const match = await comparePassword(password, user_password);
  if (!match) {
    throw customError(401, "Wrong password");
  }
  // => await comparePassword(password, user.password);
  return match;
};

const swithcFromadmin_user = async (id) => {
  // Construct the message
  try {
    const userrespons = await getuserProfileservice(id);

    return userrespons;
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

// Construct the message

const getuserProfileservice = async (message_Data) => {
  // Construct the message
  try {
    const userprofile = await UserProfile.findOne({ user: message_Data });

    return userprofile;
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

const getUserDetailsFromToken = async (token) => {
  // if (!token) {
  //   return {
  //     message: "session out",
  //     logout: true,
  //   };
  // }

  let decode;

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      return "Invalid token";
    } else {
      decode = decodedToken;
    }
  });

  const user = await UserProfile.findOne({
    user: decode?._id,
  }).populate({
    path: "user",
    // model: "User",
    // select: "-password -createdAt, -updatedAt, -__v",
  });

  console.log({
    jjjj: user,
  });

  return user;
};

// const { ConversationModel } = require("../models/ConversationModel")

const getConversation = async (currentUserId) => {
  if (currentUserId) {
    const currentUserConversation = await ConversationModel.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    })
      .sort({ updatedAt: -1 })
      .populate("messages")
      .populate("sender")
      .populate("receiver");

    const conversation = currentUserConversation.map((conv) => {
      const countUnseenMsg = conv?.messages?.reduce((preve, curr) => {
        const msgByUserId = curr?.msgByUserId?.toString();

        if (msgByUserId !== currentUserId) {
          return preve + (curr?.seen ? 0 : 1);
        } else {
          return preve;
        }
      }, 0);

      return {
        _id: conv?._id,
        sender: conv?.sender,
        receiver: conv?.receiver,
        unseenMsg: countUnseenMsg,
        lastMsg: conv.messages[conv?.messages?.length - 1],
      };
    });

    return conversation;
  } else {
    return [];
  }
};

// const getRecipientsByEmails = async () => {
//   try {
//     const targetEmails = [
//       "captainrunner@mail.com",
//       "test@mail.com",
//       "pgworks001@gmail.com",
//     ];
//     const profiles = await UserProfile.find().populate({
//       path: "user",
//       match: {
//         email: { $in: targetEmails },
//       },
//     });

//     let ccrecipients = profiles
//       .filter((profile) => profile.user !== null)
//       .map((profile) => ({
//         id: profile.user._id.toString(),
//         email: profile.user.email,
//         pushToken: profile.user.tokens || profile.pushtoken,
//       }))
//       .filter((recipient) => recipient.pushToken);

//     let title = "title";
//     let body = "we moive";
//     let data = {};

//     console.log({
//       fff: recipients,
//     });

//     let recipients = [
//       {
//         id: "6808da7a8b7200b3d2fb282e",
//         email: "test@mail.com",
//         pushToken: "ExponentPushToken[qbvfMlHiCP5YrdjwM9G4xv]",
//       },
//       {
//         id: "682b4ff5daef1206fd9336ba",
//         email: "pgworks001@gmail.com",
//         pushToken: "ExponentPushToken[qbvfMlHiCP5YrdjwM9G4xv]",
//       },
//       {
//         id: "685b5de32c667925467e751e",
//         email: "captainrunner@mail.com",
//         pushToken: "ExponentPushToken[JkBforLEz0oHFvMvV0tY4h]",
//       },
//     ];
//     const tickets = await sendBulkNotifications(
//       //   userProfile.pushToken,
//       recipients,
//       title,
//       body,
//       data
//     );

//     return tickets;
//   } catch (error) {
//     console.log({
//       vvv: error,
//     });

//     throw new Error("Failed to fetch recipients");
//   }
// };

const getRecipientsByEmails = async () => {
  try {
    const targetEmails = [
      "captainrunner@mail.com",
      "test@mail.com",
      "pgworks001@gmail.com",
      "support@pausepoint.net",
    ];
    const profiles = await UserProfile.find().populate({
      path: "user",
      match: {
        email: { $in: targetEmails },
      },
    });

    // First get the actual recipients from DB
    const dbRecipients = profiles
      .filter((profile) => profile.user !== null)
      .map((profile) => ({
        id: profile.user._id.toString(),
        email: profile.user.email,
        pushToken: profile.user.tokens || profile.pushtoken,
      }))
      .filter((recipient) => recipient.pushToken);

    console.log({
      fff: dbRecipients, // Now using the correctly declared variable
    });

    // For testing, you can use hardcoded recipients if needed
    const testRecipients = [
      {
        id: "6808da7a8b7200b3d2fb282e",
        email: "test@mail.com",
        pushToken: "ExponentPushToken[qbvfMlHiCP5YrdjwM9G4xv]",
      },
      {
        id: "682b4ff5daef1206fd9336ba",
        email: "pgworks001@gmail.com",
        pushToken: "ExponentPushToken[qbvfMlHiCP5YrdjwM9G4xv]",
      },
      {
        id: "685b5de32c667925467e751e",
        email: "captainrunner@mail.com",
        pushToken: "ExponentPushToken[JkBforLEz0oHFvMvV0tY4h]",
      },
    ];

    const title = "Errand";
    const body = "Someone has requested for Errand";
    const data = {};

    // Choose which recipients to use (DB or test)
    const recipients = dbRecipients;
    // dbRecipients.length > 0 ? dbRecipients : testRecipients;

    const tickets = await sendBulkNotifications(recipients, title, body, data);

    return tickets;
  } catch (error) {
    console.error("Error in getRecipientsByEmails:", error);
    throw new Error("Failed to fetch recipients");
  }
};
// module.exports = getConversation

export {
  getuserProfileservice,
  getUserDetailsFromToken,
  getConversation,
  mobile_user_loginService,
  findUserByEmail,
  validatePassword,
  getRecipientsByEmails,
};
