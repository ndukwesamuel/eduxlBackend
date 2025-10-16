import forumModel from "../../../models/forumModel.js";

export const adminCreateForum = async (req, res) => {
  try {
    const user_id = req.user._id;
    const { content, clanId } = req.body;

    const newPost = new forumModel({
      content: content,
      user: user_id,
      clan: clanId,
      announcement: true,
    });

    await newPost.save();

    res.status(200).json({
      message: "Post created successfully",
      newPost,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const GetAllForum = async (req, res) => {
  try {
    const { clanId } = req.params;
    const forums = await forumModel
      .find({ clan: clanId })
      .populate({
        path: "user",
        populate: {
          path: "user",
          model: "User",
        },
      })
      .populate("likes comments.user comments.replies.user")
      .sort({ createdAt: -1 });

    if (!forums || forums.length === 0) {
      return res
        .status(200)
        .json({ message: "No forums found for the given clan ID", forums });
    }

    res.json({
      message: "GetAllForum",
      forums,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const DeleteForum = async (req, res) => {
  try {
    const { forumId } = req.params;
    const { clanId } = req.params;
    const forum = await forumModel.find({ _id: forumId, clan: clanId });

    if (!forum) {
      return res.status(404).json({ message: "Forum not found" });
    }

    await forumModel.findByIdAndDelete(forumId);

    res.status(200).json({
      message: "Forum deleted successfully",
      forum,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const UpdateCreateForum = async (req, res) => {
  try {
    const { forumId } = req.params;
    const { content } = req.body;
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
