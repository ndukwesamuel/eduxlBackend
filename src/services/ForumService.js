import { Expo } from "expo-server-sdk";
import forumModel from "../models/forumModel.js";

let expo = new Expo({
  // accessToken: process.env.EXPO_ACCESS_TOKEN,
  useFcmV1: false, // this can be set to true in order to use the FCM v1 API
});

const createfroumservice = async (message_Data) => {
  // Construct the message
  try {
    const newPost = await forumModel.create({
      ...message_Data,
    });
    return newPost;
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

const Getfroumservice = async (message_Data) => {
  // Construct the message
  try {
    const forums = await forumModel
      .find({ ...message_Data })
      .populate("user likes comments.user comments.replies.user")
      .sort({ createdAt: -1 }); // Sort by createdAt field in descending order

    return forums;
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

// return customError(401, "Beneficiary already exists for this user");

export { createfroumservice, Getfroumservice };
