import { Expo } from "expo-server-sdk";
import forumModel from "../models/forumModel.js";
import Clan from "../models/clan.js";
import { customError } from "../utils/customError.js";

let expo = new Expo({
  // accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: false, // this can be set to true in order to use the FCM v1 API
});

const FindClanService = async (message_Data) => {
  // Construct the message
  try {
    const newClan = new Clan({
      name: message_Data.name,
      email: message_Data.email,
      address: message_Data.address,
      phonenumber: message_Data.phonenumber,
      creator: message_Data.userInfo?._id,
      members: [{ user: message_Data.userInfo?._id, status: "approved" }],
      admins: [{ user: message_Data.userInfo?._id, level: 1 }],
      status: "approved",
    });
    await newClan.save();

    return newClan;
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

const FindClanByEmail = async (email) => {
  // Construct the message
  if (!email) {
    throw customError(400, "Please provide an email");
  }
  const clan_info = await Clan.findOne({ email: email.toLowerCase() });
  // if (!clan_info) {
  //   throw customError(401, "No Clan with this Email");
  // }
  return clan_info;
};

const Getfroumservice = async (message_Data) => {
  // Construct the message
  try {
    const forums = await forumModel
      .find({ ...message_Data })
      .populate("user likes comments.user comments.replies.user");

    return forums;
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

// return customError(401, "Beneficiary already exists for this user");

export { FindClanService, Getfroumservice, FindClanByEmail };
