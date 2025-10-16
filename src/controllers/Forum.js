import forumModel from "../models/forumModel.js";
import user from "../models/user.js";
import userprofile from "../models/profile.js";
import Clan from "../models/clan.js";
import asyncWrapper from "../middlewares/asyncWrapper.js";
import {
  createfroumservice,
  Getfroumservice,
} from "../services/ForumService.js";

// Controller function to create a new post
export const CreateForum = async (req, res) => {
  try {
    // Extract data from the request body

    const user_id = req.user._id;

    const userprofileRes = await userprofile.findOne({ user: user_id });

    const clan_info = req.clan;

    const { content } = req.body;

    const newPost = new forumModel({
      content: content,
      user: userprofileRes?._id,
      clan: clan_info._id, // Add the clan reference
    });

    // // Save the new post to the database
    await newPost.save();

    res.status(200).json({
      message: "Post created successfully",
      newPost,
      user_id: userprofileRes?._id,
      user_id2: user_id,
    });
  } catch (error) {
    console.error(error);
    // Handle any errors and send a 500 Internal Server Error response
    res.status(500).json({ error: "Internal server error" });
  }
};

export const DeleteForum = async (req, res) => {
  try {
    const { forumId } = req.params;
    const user_id = req.user._id;

    const clan_info = req.clan;
    // // Find the forum by ID
    const forum = await forumModel.findById(forumId);

    // Check if the forum exists
    if (!forum) {
      return res.status(404).json({ message: "Forum not found" });
    }

    // Check if the user is the creator of the forum
    if (forum.user.toString() !== user_id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this forum" });
    }

    // // Delete the forum
    await forumModel.findByIdAndDelete(forumId);

    res.status(200).json({
      message: "Forum deleted successfully",
      forum,
      clan_info,
      user_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const GetAllForum = async (req, res) => {
  try {
    const user_id = req.user._id;

    const clan_info = req.clan;

    // Fetch forums and sort by createdAt in descending order
    // const forums = await forumModel
    //   .find({ clan: clan_info._id })
    //   .populate("likes comments.user comments.replies.user user")
    //   .sort({ createdAt: -1 }); // Sort by createdAt field in descending order

    const forums = await forumModel
      .find({ clan: clan_info._id })
      .populate({
        path: "user",
        populate: {
          path: "user",
          model: "User", // Explicitly specify the model
        },
      })
      .populate("likes comments.user comments.replies.user")
      .sort({ createdAt: -1 });

    if (!forums || forums.length === 0) {
      return res
        .status(200)
        .json({ message: "No forums found for the given clan ID", forums });
    }

    // Transform the user structure
    // const transformedForums = forums.map((forum) => {
    //   if (forum.user) {
    //     return {
    //       ...forum,
    //       user: {
    //         ...forum.user,
    //         name: forum.user.user?.name, // Add name at profile level
    //       },
    //     };
    //   }
    //   return forum;
    // });

    // if (!transformedForums.length) {
    //   return res.status(200).json({
    //     message: "No forums found",
    //     forums: [],
    //   });
    // }

    // res.json({ message: "GetAllForum", forums });
    res.json({
      message: "GetAllForum",

      forums,
      clan_info,
      user_id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const UpdateCreateForum = async (req, res) => {
  // const forum = await Forum.find();
  // res.status(StatusCodes.OK).json({ forum });
  let forumId = req.params.forumId;
  const { content } = req.body;

  try {
    const user_id = req.user._id;
    const existingUser = await user.findById(user_id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // const forum = await forumModel.find();
    const forum = await forumModel.findById(forumId);

    if (!forum) {
      return res.status(404).json({ error: "Forum not found" });
    }

    forum.content = content || forum.content;
    const updatedForumEntry = await forum.save();
    res.status(200).json({
      message: "Forum entry content updated successfully",
      data: updatedForumEntry,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Import necessary modules

export const Like_and_Dislike_Forum = async (req, res) => {
  const userId = req.user._id;
  const postId = req.params.forumId;

  try {
    const user_info = await user.findById(userId);

    const post = await forumModel.findById(postId);

    if (!user_info || !post) {
      return res.status(404).json({ error: "User or post not found" });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // User has already liked the post, so unlike it
      post.likes = post.likes.filter((likeId) => likeId.toString() !== userId);
    } else {
      // User has not liked the post, so like it
      post.likes.push(userId);
    }
    await post.save();
    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const Comment_on_Forum = asyncWrapper(async (req, res) => {
  let { content, parentCommentId, postId } = req.body;
  let clan_info = req.clan;

  const user_id = req.user._id;

  // try {
  const forum = await forumModel.findById(postId);

  if (!forum) {
    return res.status(404).json({ error: "Post not found" });
  }

  const newComment = {
    user: user_id,
    content: content,
  };

  if (parentCommentId) {
    // If parentCommentId is provided, it's a reply to an existing comment
    const parentComment = forum.comments.id(parentCommentId);
    if (parentComment) {
      parentComment.replies.push(newComment);
    } else {
      return res.status(404).json({ error: "Parent comment not found" });
    }
  } else {
    // Otherwise, it's a top-level comment
    forum.comments.push(newComment);
  }

  // let nnnnn = forum.comments;

  await forum.save();

  res.status(201).json({ forum });
});

export const UpdateComment = async (req, res) => {
  console.log({
    req,
    res,
  });
  // const forum = await Forum.find();
  // res.status(StatusCodes.OK).json({ forum });

  try {
    const user_id = req.user._id;
    const existingUser = await user.findById(user_id);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const forum = await forumModel.find();

    res.json({ message: "GetAllForum", forum });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const Admin_Create_announcement = async (req, res) => {
  try {
    // Extract data from the request body

    const user_id = req.user._id;

    const userprofileRes = await userprofile.findOne({ user: user_id });

    const clan_info = req.clan;

    const { content } = req.body;

    const newPost = new forumModel({
      content: content,
      // user: user_id,
      user: userprofileRes?._id,

      clan: clan_info._id, // Add the clan reference
      announcement: true,
    });

    // // Save the new post to the database
    await newPost.save();

    res.status(200).json({ message: "Post created successfully", newPost });
  } catch (error) {
    console.error(error);
    // Handle any errors and send a 500 Internal Server Error response
    res.status(500).json({ error: "Internal server error" });
  }
};

export const Admin_Get_All_announcement = async (req, res) => {
  try {
    const user_id = req.user._id;

    let clanId = req.params.clanId;
    let clanData = req.clan;

    const forums = await forumModel
      .find({ clan: clanData._id, announcement: true })
      .populate("user likes comments.user comments.replies.user")
      .sort({ createdAt: -1 }); // Sort by createdAt field in descending order

    if (!forums || forums.length === 0) {
      return res
        .status(200)
        .json({ message: "No forums found for the given clan ID", forums });
    }

    res.json({ message: "GetAllForum", forums });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const UserCreateForum = asyncWrapper(async (req, res, next) => {
  const user_id = req.user._id;
  const clan_info = req.clan;
  const { content } = req.body;

  const createfroumserviceRespond = await createfroumservice({
    content: content,
    user: user_id,
    clan: clan_info._id, // Add the clan reference
  });

  res.status(200).json({
    data: createfroumserviceRespond,
    message: "Post created successfully",
  });
});

export const GetUserForum = asyncWrapper(async (req, res, next) => {
  const user_id = req.user._id;
  let clanData = req.clan;
  const GetfroumserviceRespond = await Getfroumservice({
    clan: clanData._id,
    // announcement: true,
  });

  res.status(200).json({
    data: GetfroumserviceRespond,
    message: "Post created successfully",
  });
});

export const GetSingleForum = asyncWrapper(async (req, res) => {
  const user_id = req.user._id;
  let clanData = req.clan;
  let forumId = req.params.forumId;

  let GetfroumserviceRespond = await Getfroumservice({
    _id: forumId,
    clan: clanData._id,
  });

  GetfroumserviceRespond = GetfroumserviceRespond[0];
  res
    .status(200)
    .json({ message: "Get Single Forum", data: GetfroumserviceRespond });
});
