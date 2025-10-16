import mongoose from "mongoose";
import forumModel from "../../../models/forumModel.js";
import SuperAdminAnnouncement from "../../../models/SuperAdminAnnouncement.js";
import user from "../../../models/user.js";
import UserProfile from "../../../models/profile.js";

export const superAdminCreateForum = async (req, res) => {
  try {
    const user_id = req.user._id; // Assuming req.user is populated by authentication middleware
    const { title, content, link, estateIds, global } = req.body;

    // Make global explicitly a boolean for consistent checks
    const isGlobalAnnouncement = !!global;
    // Use user_id from req.user as the postedBy
    const postedBy = user_id;

    // --- Input Validation ---
    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required." });
    }

    // Validate postedBy (user_id) - crucial for security, assuming valid ObjectId from auth
    if (!mongoose.Types.ObjectId.isValid(postedBy)) {
      return res
        .status(400)
        .json({ message: "Invalid authenticated user ID for posting." });
    }

    // Filter out any invalid ObjectIDs from the provided estateIds array
    const validEstateIds = Array.isArray(estateIds)
      ? estateIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
      : [];

    // --- Logic for Global vs. Targeted Announcements (Drier & More Explicit) ---
    if (isGlobalAnnouncement) {
      // If global is true, estateIds array must be empty
      if (validEstateIds.length > 0) {
        return res.status(400).json({
          message:
            "A global announcement cannot be assigned to specific estates. 'estateIds' must be empty.",
        });
      }
    } else {
      // If global is false (i.e., targeted), at least one valid estate ID must be provided
      if (validEstateIds.length === 0) {
        return res.status(400).json({
          message:
            "If the announcement is not global, at least one valid estate ID must be provided in 'estateIds'.",
        });
      }
    }
    // --- End Logic for Global vs. Targeted Announcements ---

    const newAnnouncement = new SuperAdminAnnouncement({
      title,
      content,
      link,
      // Set estateId based on whether it's a global announcement or not
      estateId: isGlobalAnnouncement ? [] : validEstateIds,
      global: isGlobalAnnouncement,
      postedBy,
    });

    const savedAnnouncement = await newAnnouncement.save();

    res.status(201).json({
      message: "Announcement created successfully",
      data: savedAnnouncement,
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    // Provide a generic error message to the client for security, log details internally
    res.status(500).json({
      message: "Failed to create announcement.",
      details: error.message,
    });
  }
};

export const superAdminUpdateAnnouncement = async (req, res) => {
  try {
    const userId = req.user._id; // ID of the authenticated Super Admin user

    const { announcementId, title, content, date, link, estateIds, global } =
      req.body;

    // --- 1. Basic Input Validation ---
    // Ensure announcement ID is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res
        .status(400)
        .json({ message: "Invalid announcement ID provided." });
    }

    // Ensure authenticated user ID is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid user ID." });
    }

    // Prepare update object, only include fields that are present in req.body
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (content !== undefined) updateFields.content = content;
    if (date !== undefined) updateFields.date = date ? new Date(date) : null; // Handle null/undefined dates
    if (link !== undefined) updateFields.link = link;

    // --- 2. Retrieve existing announcement for authorization and validation ---
    const existingAnnouncement = await SuperAdminAnnouncement.findById(
      announcementId
    );

    if (!existingAnnouncement) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    // --- 3. Authorization: Only the original poster (Super Admin) can update ---
    // Or you might check if the user has a 'super_admin' role, depending on your auth setup
    if (existingAnnouncement.postedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        message:
          "Forbidden: You are not authorized to update this announcement.",
      });
    }

    // --- 4. Special Validation for 'global' and 'estateIds' ---
    // Determine the 'global' status for validation.
    // If 'global' is provided in req.body, use it. Otherwise, use existing value.
    const isGlobalAnnouncement =
      global !== undefined ? !!global : existingAnnouncement.global;

    // Filter valid estateIds from input, if provided. Otherwise, use existing.
    const incomingEstateIds = Array.isArray(estateIds)
      ? estateIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
      : existingAnnouncement.estateId.map((id) => id.toString()); // Convert ObjectIds to strings for consistent comparison

    if (isGlobalAnnouncement) {
      // If global is true, estateIds array must be empty
      if (incomingEstateIds.length > 0) {
        return res.status(400).json({
          message:
            "A global announcement cannot be assigned to specific estates. 'estateIds' must be empty when 'global' is true.",
        });
      }
      updateFields.global = true;
      updateFields.estateId = []; // Ensure estateId is empty for global announcements
    } else {
      // If global is false (i.e., targeted), at least one valid estate ID must be provided
      if (incomingEstateIds.length === 0) {
        return res.status(400).json({
          message:
            "If the announcement is not global, at least one valid estate ID must be provided in 'estateIds'.",
        });
      }
      updateFields.global = false;
      updateFields.estateId = incomingEstateIds; // Set the provided valid estate IDs
    }
    // --- End Special Validation ---

    // --- 5. Perform the Update ---
    // Use findByIdAndUpdate to update the document.
    // { new: true } returns the updated document.
    // { runValidators: true } ensures schema validations run on the update operation.
    const updatedAnnouncement = await SuperAdminAnnouncement.findByIdAndUpdate(
      announcementId,
      updateFields,
      { new: true, runValidators: true }
    );

    // This check is mostly redundant due to initial existingAnnouncement check, but good for defensive coding
    if (!updatedAnnouncement) {
      return res
        .status(404)
        .json({ message: "Announcement not found after update attempt." });
    }

    res.status(200).json({
      message: "Announcement updated successfully",
      data: updatedAnnouncement,
    });
  } catch (error) {
    console.error("Error updating announcement:", error);
    // Mongoose validation errors will have 'name: "ValidationError"'
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation Error", details: error.message });
    }
    res.status(500).json({
      message: "Failed to update announcement.",
      details: error.message,
    });
  }
};

// export const GetAllForum = async (req, res) => {
//   try {
//     const profiles = await UserProfile.find({
//       currentClanMeeting: { $exists: true, $ne: null },
//     })
//       .populate({
//         path: "user",
//         match: { tokens: { $exists: true, $ne: null } }, // Only populate users who have tokens
//       })
//       .populate("currentClanMeeting");

//     // Filter out profiles where user is null (due to the match condition)
//     const filteredProfiles = profiles.filter(
//       (profile) => profile.user !== null
//     );

//     res.status(200).json(filteredProfiles);
//   } catch (error) {
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

export const GetAllForum = async (req, res) => {
  try {
    const announcements = await SuperAdminAnnouncement.find({}).sort({
      updatedAt: -1,
    }); // Sort by last updated
    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const superAdminDeleteAnnouncement = async (req, res) => {
  try {
    // --- CHANGE START ---
    // Get the announcementId from req.body instead of req.params
    const { announcementId } = req.body;
    // --- CHANGE END ---

    const userId = req.user._id; // ID of the authenticated Super Admin user

    // --- 1. Basic Input Validation ---
    // Ensure announcement ID is valid ObjectId
    if (!announcementId || !mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(400).json({
        message: "Valid announcement ID must be provided in the request body.",
      });
    }

    // Ensure authenticated user ID is valid
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid user ID." });
    }

    // --- 2. Retrieve existing announcement for authorization ---
    const existingAnnouncement = await SuperAdminAnnouncement.findById(
      announcementId
    );

    if (!existingAnnouncement) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    // --- 3. Authorization: Only the original poster (Super Admin) can delete ---
    // Alternatively, if any Super Admin can delete, you would check the user's role here
    if (existingAnnouncement.postedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        message:
          "Forbidden: You are not authorized to delete this announcement.",
      });
    }

    // --- 4. Perform the Delete ---
    await SuperAdminAnnouncement.findByIdAndDelete(announcementId);

    res.status(200).json({
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({
      message: "Failed to delete announcement.",
      details: error.message,
    });
  }
};

export const DeleteForum = async (req, res) => {
  try {
    const { forumId } = req.params;
    const forum = await forumModel.findById(forumId);

    if (!forum) {
      return res.status(404).json({ message: "Forum not found" });
    }

    await forumModel.findByIdAndDelete(forumId);

    res.status(200).json({
      message: "Forum deleted successfully",
      forum,
    });
  } catch (error) {
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
    res.status(500).json({ error: "Internal server error" });
  }
};
