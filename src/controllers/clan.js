import Clan from "../models/clan.js";
import UserProfile from "../models/profile.js";
// import { hashPassword } from "../utils/auth.js"; // Adjust the path to your password hashing utility

import User from "../models/user.js";
import slugify from "slugify";
import { FindClanByEmail, FindClanService } from "../services/clanService.js";
import { findUserByEmail } from "../services/Userservice.js";
import { customError } from "../utils/customError.js";
import asyncWrapper from "../middlewares/asyncWrapper.js";
import { hashPassword, comparePassword } from "../helpers/auth.js";

import mongoose from "mongoose";

export const registerAndCreateClan = async (req, res) => {
  const session = await mongoose.startSession(); // Start a new session
  session.startTransaction(); // Start a transaction

  try {
    const { name, email, clanName, clanAddress, clanPhone } = req.body;

    let password = "123456789";
    // Validate required fields for user registration
    if (!name || !email || !password || password.length < 6) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        error: "Name, email, and password (at least 6 characters) are required",
      });
    }

    // Validate required fields for clan creation
    const requiredClanFields = ["clanName", "clanAddress", "clanPhone"];
    const missingClanFields = requiredClanFields.filter(
      (field) => !req.body[field]
    );

    if (missingClanFields.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        error: "Missing required clan fields: " + missingClanFields.join(", "),
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Email is already taken" });
    }

    // Check if clan with the same email already exists
    const existingClan = await Clan.findOne({ email }).session(session);
    if (existingClan) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ error: "Clan already exists with this email" });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user within the transaction
    const user = await User.create(
      [
        {
          name,
          email,
          password: hashedPassword,
          isVerified: true,
        },
      ],
      { session }
    );

    // Create the user profile within the transaction (if needed)
    const userProfile = await UserProfile.create(
      [
        {
          user: user[0]._id,
        },
      ],
      { session }
    );

    // Create the clan within the transaction
    const clan = await Clan.create(
      [
        {
          name: clanName,
          email,
          address: clanAddress,
          phonenumber: clanPhone,
          status: "approved",
          creator: user[0]._id, // Set the creator to the newly registered user
          admins: [
            {
              user: user[0]._id,
              level: 1, // Assuming level 5 is the highest admin level
            },
          ],
          members: [
            {
              user: user[0]._id,
              status: "approved", // Automatically approve the creator
            },
          ],
        },
      ],
      { session }
    );

    // Commit the transaction if everything is successful
    await session.commitTransaction();
    session.endSession();

    // Send OTP to the user's email (outside the transaction)
    // const emailInfo = await sendOTPByEmail(email, name);

    // Return success response
    return res.status(201).json({
      success: true,
      // message: `OTP has been sent to ${emailInfo.envelope.to}`,
      user: user[0],
      clan: clan[0],
    });
  } catch (error) {
    // Abort the transaction in case of any error
    await session.abortTransaction();
    session.endSession();

    console.error("Error in registerAndCreateClan:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const createClan = async (req, res) => {
  try {
    const User_id = req.user._id;

    const requiredFields = ["name", "address", "phone", "email"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      throw new Error("Missing required fields: " + missingFields.join(", "));
    }

    const { name, address, phone, email } = req.body;

    const FindClanByEmailResponse = await FindClanByEmail(email);

    if (FindClanByEmailResponse) {
      throw customError(400, "Clan Alrready Exists with this Email ");
    }
    const userInfo = await findUserByEmail(email);

    let item = { name, address, phone, email, userInfo };
    const clan = await FindClanService(item);

    return res.status(201).json({
      success: true,
      clan: clan, //"clan",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllClans = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 1000000000,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    const skip = (pageNumber - 1) * limitNumber;

    const validSortOrders = ["asc", "desc"];
    const sortOrderParam = validSortOrders.includes(sortOrder.toLowerCase())
      ? sortOrder.toLowerCase()
      : "asc";

    // Use aggregate to populate user information for members, creator, and admins
    const clans = await Clan.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "members.user",
          foreignField: "_id",
          as: "membersData",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "creator",
          foreignField: "_id",
          as: "creatorData",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "admins.user",
          foreignField: "_id",
          as: "adminsData",
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limitNumber,
      },
      {
        $sort: { [sortBy]: sortOrderParam === "asc" ? 1 : -1 },
      },
    ]);

    const totalClans = await Clan.countDocuments();

    return res.status(200).json({
      success: true,
      pagination: {
        total: totalClans,
        page: pageNumber,
        limit: limitNumber,
      },
      data: clans,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
export const updateClan = async (req, res) => {
  try {
    const { clanId } = req.params;
    const { name, description } = req.body;

    // Check if the clan with the given ID exists
    const existingClan = await Clan.findById(clanId);

    if (!existingClan) {
      return res.status(404).json({ success: false, error: "Clan not found" });
    }

    const nameSlug = slugify(name).toLowerCase();
    existingClan.slug = nameSlug;

    // Check if the user making the request is an admin of the clan and has level 1
    const isAdminLevel1 =
      existingClan.admins &&
      existingClan.admins.some((admin) => {
        return (
          admin.user && admin.user.equals(req.user._id) && admin.level === 1
        );
      });

    if (!isAdminLevel1) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to update this clan",
      });
    }

    // Check if the updated name conflicts with other existing clans
    if (name && name !== existingClan.name) {
      const isNameTaken = await Clan.findOne({ name });

      if (isNameTaken) {
        return res
          .status(400)
          .json({ success: false, error: "Name already exists" });
      }
    }

    // Update the clan properties
    existingClan.name = name || existingClan.name;
    existingClan.description = description || existingClan.description;

    // Save the updated clan
    await existingClan.save();

    return res.status(200).json({
      success: true,
      data: existingClan,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Get all clans with pagination and limit

export const getClanById = async (req, res) => {
  try {
    const { clanId } = req.params;
    // const clan = await Clan.findById(clanId);

    const clan = await Clan.findById(clanId).populate({
      path: "admins.user members.user creator",
      model: User,
      select: "name email photo isAdmin isVendor isActive roles", // Adjust fields as needed
    });

    if (!clan) {
      return res.status(404).json({ success: false, error: "Clan not found." });
    }

    return res.status(200).json({ success: true, data: clan });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const confirmClan_Suspend_Approve_reject = async (req, res) => {
  try {
    const { action, clanId } = req.body;

    let updateData;

    const clan = await Clan.findById(clanId);
    if (!clan) {
      return res.status(404).json({ success: false, error: "Clan not found." });
    }

    if (action === "approve") {
      updateData = { status: "approved" };
    } else if (action === "reject") {
      await Clan.findByIdAndDelete(clanId);
      return res
        .status(200)
        .json({ message: "Clan rejected and deleted successfully." });
    } else if (action === "suspend") {
      updateData = { status: "suspended" };
    } else {
      return res.status(400).json({ error: "Invalid action specified." });
    }
    const confirmation = await Clan.findByIdAndUpdate(clanId, updateData);

    res.status(200).json({ message: `Clan ${action}ed successfully.` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const requestToJoinClan = async (req, res) => {
  // const { userId, clanId } = req.body; // Assuming you're sending userId and clanId in the request body
  const userId = req.user._id;
  const clanId = req.params.clanId;
  try {
    // Find the clan by ID
    const clan = await Clan.findById(clanId);

    // Check if the clan exists
    if (!clan) {
      return res.status(404).json({ message: "Clan not found" });
    }

    // Check if the user is already a member or has a pending request
    const existingMember =
      clan.members &&
      clan.members.find(
        (member) =>
          member.user &&
          member.user.toString() === userId &&
          member.status !== "rejected"
      );

    if (existingMember) {
      return res
        .status(400)
        .json({ message: "User is already a member or has a pending request" });
    }

    // Add the user to the members array with a pending status
    clan.members.push({
      user: userId,
      status: "pending",
    });

    // Save the updated clan
    await clan.save();

    return res
      .status(200)
      .json({ message: "Membership request sent successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Define a function to handle approval or rejection by clan admins
export const EstateAdminsApproveMembership = async (req, res) => {
  const { clanId, memberId, approvalStatus } = req.body;

  let adminId = req.user._id;
  try {
    // Find the clan admin by ID
    const clan_info = await Clan.findById(clanId);
    console.log({
      clan_info,
    });

    const isAdmin = clan_info.admins.some(
      (admin) =>
        admin.user.toString() === adminId.toString() &&
        (admin.level === 1 || admin.level === 2)
    );

    //  Check if the admin exists and has sufficient level
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized: Insufficient admin level" });
    }

    // Find the member in the clan's members array
    const memberIndex = clan_info.members.findIndex(
      (member) => member.user.toString() === memberId.toString()
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found in clan" });
    }

    // Update the member's status based on the approval status
    clan_info.members[memberIndex].status = approvalStatus;

    // If approvalStatus is "rejected," remove the member from the clan
    if (approvalStatus === "rejected") {
      clan_info.members.splice(memberIndex, 1);
    }

    if (["pending", "rejected", "suspended"].includes(approvalStatus)) {
      await User.findByIdAndUpdate(memberId, { isGuest: false });
    }

    // ✅ Automatically update isGuest on user
    if (approvalStatus === "approved") {
      await User.findByIdAndUpdate(memberId, { isGuest: false });
    }

    // Save the updated clan
    await clan_info.save();

    return res.status(200).json({
      message: "Membership status updated successfully",
      memberId,
      approvalStatus,
      clan_info,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const leaveClan = async (req, res) => {
  try {
    const { clanId } = req.params;
    const userId = req.user._id;
    const user = await User.findById(userId);
    const clan_info = await Clan.findById(clanId);

    // Check if the member is in the clan
    const memberIndex = clan_info.members.findIndex(
      (member) => member.user.toString() === userId.toString()
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found in clan" });
    }
    // Remove the member from the clan
    clan_info.members.splice(memberIndex, 1);

    // Save the updated clan
    await clan_info.save();

    return res.status(200).json({
      message: "Member successfully left the clan",
      clan_info,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const read = async (req, res) => {
  try {
    const clan = await Clan.findOne({ slug: req.params.clanSlug }).populate(
      "creator"
    );
    res.json({ success: true, clan });
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};

// Delete a clan
export const deleteClan = async (req, res) => {
  const adminId = req.user._id;
  const clanId = req.params.clanId;
  try {
    const clan_info = await Clan.findById(clanId);

    if (!clan_info) {
      return res.status(404).json({ success: false, error: "Clan not found." });
    }

    // await Clan.findByIdAndDelete(clanId);
    return res.status(200).json({
      message: "Clan successfully deleted",
      clan_info,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Controller function to get all clans for a user
export const getUserClans = async (req, res) => {
  try {
    // Assuming you have the user's ID in the request object
    const userId = req.user._id;

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }
    // Find all clans where the user is a member
    const userClans = await Clan.find({ "members.user": existingUser._id })
      .populate("creator", "username") // Populate creator details
      .populate("admins.user", "username") // Populate admin details
      .populate("members.user", "username")
      .sort({ createdAt: -1 }); // Sort by createdAt field in descending order // Populate member details

    // Check if user is not found in any clan
    if (!userClans) {
      return res.status(404).json({ message: "User not found in any clans" });
    }

    // Send the list of clans where the user is a member
    res.status(200).json(userClans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const Select_clan = async (req, res) => {
  try {
    // Assuming you have the user's ID in the request object
    const userId = req.user._id;

    const clan_info = req.clan;

    // const userProfile = await UserProfile.findOne({ user: userId });

    const userProfile = await UserProfile.findOne({ user: userId })
      .populate("user") // Populate the 'user' field with user details
      .populate("currentClanMeeting");

    // Convert ObjectIDs to strings for comparison
    const data2String = String(clan_info?._id);
    const dataString = String(userProfile.currentClanMeeting?._id);

    // Check if the IDs are equal
    const idsAreEqual = data2String === dataString;

    if (idsAreEqual) {
      return res.status(400).json({
        message: "User is already in the clan meeting.",
      });
    }

    userProfile.currentClanMeeting = clan_info?._id;

    userProfile.AdmincurrentClanMeeting = null;
    await userProfile.save();

    res.status(200).json({
      userProfile,
      message: "User joined the clan meeting successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};

export const Leave_Select_clan = async (req, res) => {
  try {
    // Assuming you have the user's ID in the request object
    const userId = req.user._id;

    // Find the user's profile
    const userProfile = await UserProfile.findOne({ user: userId });

    // Check if the user is in a clan meeting
    if (!userProfile.currentClanMeeting) {
      return res.status(400).json({
        message: "User is not currently in any clan meeting.",
      });
    }

    // Remove the user from the clan meeting
    userProfile.currentClanMeeting = null;
    await userProfile.save();

    res.status(200).json({
      userProfile,
      message: "User left the clan meeting successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const Estate_Admin_getUserClans = async (req, res) => {
  try {
    // Assuming you have the user's ID in the request object
    const userId = req.user._id;
    const clans_info = req.clans;

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }
    // Find all clans where the user is a member

    // Send the list of clans where the user is a member
    res.status(200).json({ clans_info });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const Admin_Select__clan = async (req, res) => {
  try {
    // Assuming you have the user's ID in the request object
    const userId = req.user._id;

    const clan_info = req.clan;

    // // const userProfile = await UserProfile.findOne({ user: userId });

    const userProfile = await UserProfile.findOne({ user: userId })
      .populate("user") // Populate the 'user' field with user details
      .populate("currentClanMeeting")
      .populate("AdmincurrentClanMeeting");

    // // Check if the user is already in the clan meeting

    // // Convert ObjectIDs to strings for comparison
    const data2String = String(clan_info?._id);
    const dataString = String(userProfile.AdmincurrentClanMeeting?._id);

    // // Check if the IDs are equal
    const idsAreEqual = data2String === dataString;

    if (idsAreEqual) {
      return res.status(400).json({
        message: "Admin is already an  the clan meeting.",
      });
    }

    userProfile.AdmincurrentClanMeeting = clan_info?._id;
    userProfile.currentClanMeeting = null;
    await userProfile.save();

    res.status(200).json({
      userProfile,
      clan_info,
      message: "User joined the clan meeting successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const Admin_Leave_Select_clan = async (req, res) => {
  try {
    // Assuming you have the user's ID in the request object
    const userId = req.user._id;

    // Find the user's profile
    const userProfile = await UserProfile.findOne({ user: userId });

    // Check if the user is in a clan meeting
    if (!userProfile.AdmincurrentClanMeeting) {
      return res.status(400).json({
        message: "User is not currently in any clan meeting.",
      });
    }

    // Remove the user from the clan meeting
    userProfile.currentClanMeeting = null;
    userProfile.AdmincurrentClanMeeting = null;

    await userProfile.save();

    res.status(200).json({
      userProfile,
      message: "User left the clan meeting successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// clanController.js

// Controller function to get all members of a clan by its unique ID
export const getAllMembers = async (req, res) => {
  try {
    const userId = req.user._id;
    const clan_info = req.clan;
    // const members = await Clan.find({}, 'members');
    const members = clan_info.members;
    res.status(200).json({ data: members });
  } catch (error) {
    console.error("Error fetching clan members:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// export const UsergetAllMembers = asyncWrapper(async (req, res) => {
//   const userId = req.user._id;

//   const clan_info = await Clan.findById(req.clan._id).populate({
//     path: "members.user",
//     model: "User",
//     select: "name email", // You can specify the fields you want to populate
//   });
//   if (!clan_info) {
//     return res.status(404).json({ message: "Clan not found" });
//   }

//   const members = clan_info.members;
//   res.status(200).json({ data: members });
// });

export const UsergetAllMembers = asyncWrapper(async (req, res) => {
  const clan_info = await Clan.findById(req.clan._id).populate({
    path: "members.user",
    model: "User",
    select: "name email",
  });

  if (!clan_info) {
    return res.status(404).json({ message: "Clan not found" });
  }

  // Extract user IDs from clan members
  const userIds = clan_info.members.map((member) => member.user._id);

  // Fetch all user profiles in a single query
  const userProfiles = await UserProfile.find({
    user: { $in: userIds },
  }).lean();

  // Create a map of user profiles for quick lookup
  const profileMap = userProfiles.reduce((acc, profile) => {
    acc[profile.user] = profile;
    return acc;
  }, {});

  // Merge the profiles with members
  const membersWithProfiles = clan_info.members.map((member) => ({
    ...member.toObject(),
    user: {
      ...member.user.toObject(),
      userProfile: profileMap[member.user._id] || null,
    },
  }));

  res.status(200).json({ data: membersWithProfiles });
});

export const getSingleMembers = async (req, res) => {
  try {
    const { memberID } = req.params;
    const userId = req.user._id;
    const clan_info = req.clan;

    const member = clan_info.members.find(
      (member) => member.user._id.toString() === memberID
    );
    if (!member) {
      return res.status(404).json({ message: "Member not found in the clan" });
    }

    // Find the user profile of the member
    const userProfile = await UserProfile.findOne({ user: memberID });
    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    // this will be remove in future version

    // Update the user profile with clan member data
    // Convert Mongoose document to plain JavaScript object
    const userProfileObj = userProfile.toObject();

    const modifiedAddress = {
      street: member.homeAddress || userProfileObj.address.street,
      city: "", // Empty string for city
      state: "", // Empty string for state
    };

    // res.status(200).json({ data: { member, userProfile } });
    const responseData = {
      data: {
        member,
        userProfile: {
          ...userProfileObj,
          address: modifiedAddress,
          phoneNumber: member.phonenumber || userProfileObj.phoneNumber,
        },
      },
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching clan members:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// new update to clan

export const getMembersProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const clan_info = req.clan;

    // const clan = await Clan.find({
    //   _id: clan_info._id,
    // }).populate('members.user');
    // const members = clan_info.members;
    res.status(200).json({ data: clan_info });
  } catch (error) {
    console.error("Error fetching clan members:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// // controllers/clanController.js
// import Clan from "../models/clan.js";

// /**
//  * Get a particular clan by ID or uniqueClanID
//  * @param {Object} req - Express request object
//  * @param {Object} res - Express response object
//  */
export const fakegetClan = async (req, res) => {
  // const { clanId } = req.params;
  let clanId = "67b1187e61243b230f3b9b21";
  try {
    const clan = await Clan.findOne({
      $or: [{ _id: clanId }, { uniqueClanID: clanId }],
    })
      .populate("creator", "fullName email")
      .populate("admins.user", "fullName email")
      .populate("members.user", "fullName email");

    if (!clan) {
      return res.status(404).json({ message: "Clan not found" });
    }

    res.status(200).json(clan);
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while retrieving the clan",
      error: error.message,
    });
  }
};

// export const makeMemberAdmin = async (req, res) => {
//   // const { clanId, memberId } = req.params;

//   let clanId = "67b1187e61243b230f3b9b21";
//   let memberId = "67b33ec8e12c99205b17e167";

//   try {
//     // Find the clan by ID
//     const clan = await Clan.findOne({ _id: clanId });
//     if (!clan) {
//       return res.status(404).json({ message: "Clan not found" });
//     }

//     // Find the member in the members array
//     const memberIndex = clan.members.findIndex(
//       (member) => member.user.toString() === memberId
//     );
//     if (memberIndex === -1) {
//       return res.status(404).json({ message: "Member not found" });
//     }

//     // Add the member to the admins array
//     clan.admins.push({
//       user: clan.members[memberIndex].user,
//       level: 1, // or specify the appropriate level for admin
//     });

//     // Optionally, you can update the member's status if needed (like setting them as 'admin')
//     clan.members[memberIndex].status = "admin"; // Optional if needed

//     // Save the updated clan document
//     await clan.save();

//     res
//       .status(200)
//       .json({ message: "Member successfully made an admin", clan });
//   } catch (error) {
//     res.status(500).json({
//       message: "An error occurred while making the member an admin",
//       error: error.message,
//     });
//   }
// };

// this is the test part

export const makeMemberAdmin = async (req, res) => {
  let clanId = "67b1187e61243b230f3b9b21";
  let memberId = "67b33ec8e12c99205b17e167";

  try {
    // Find the clan by ID
    const clan = await Clan.findOne({ _id: clanId });
    if (!clan) {
      return res.status(404).json({ message: "Clan not found" });
    }

    // Find the member in the members array
    const memberIndex = clan.members.findIndex(
      (member) => member.user.toString() === memberId
    );
    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Add the member to the admins array
    clan.admins.push({
      user: clan.members[memberIndex].user,
      level: 1, // or specify the appropriate level for admin
    });

    // Save the updated clan document
    await clan.save();

    res
      .status(200)
      .json({ message: "Member successfully made an admin", clan });
  } catch (error) {
    res.status(500).json({
      message: "An error occurred while making the member an admin",
      error: error.message,
    });
  }
};

const getNextNumericSequence = (current) => {
  if (!current) return "0001";
  const num = parseInt(current) + 1;
  return num > 9999 ? "0001" : String(num).padStart(4, "0");
};

const getNextAlphaSequence = (current) => {
  if (!current) return "AAAA";
  let nextAlpha = "";
  let carry = 1;
  for (let i = current.length - 1; i >= 0; i--) {
    let char = current.charCodeAt(i) + carry;
    if (char > 90) {
      // 'Z' is 90
      char = 65; // 'A' is 65
      carry = 1;
    } else {
      carry = 0;
    }
    nextAlpha = String.fromCharCode(char) + nextAlpha;
  }
  return nextAlpha;
};

const generateUniqueMemberID = (clanName, lastMemberCode) => {
  // const clanID = "PI-3-2025";
  const clanID = "OPERA1";

  if (!lastMemberCode) {
    return `${clanID}-AAAA-1001`;
  }

  const [, alpha, numeric] = lastMemberCode.split("-");

  if (numeric === "9999") {
    const nextAlpha = getNextAlphaSequence(alpha);
    return `${clanID}-${nextAlpha}-0001`;
  } else {
    const nextNumeric = getNextNumericSequence(numeric);
    return `${clanID}-${alpha}-${nextNumeric}`;
  }
};

export const updateMembersWithUniqueIDs = async (req, res) => {
  let clanId = "66998837f7240ad1b17fa4d0";
  try {
    const clan = await Clan.findOne({
      $or: [{ _id: clanId }, { uniqueClanID: clanId }],
    }).populate("members.user", "email");

    if (!clan) {
      return res.status(404).json({ message: "Clan not found" });
    }

    clan.uniqueClanID = "OPERA";

    const memberSchema = clan.schema.path("members").schema;
    if (!memberSchema.path("memberCode")) {
      memberSchema.add({
        memberCode: {
          type: String,
        },
      });
    }

    let lastMemberCode = null;
    const updatedMembers = clan.members.map((member) => {
      const memberCode = generateUniqueMemberID(
        clan.uniqueClanID,
        lastMemberCode
      );
      lastMemberCode = memberCode; // Update lastMemberCode for the next iteration
      return {
        ...member.toObject(),
        memberCode,
      };
    });

    clan.members = updatedMembers;
    await clan.save();

    res.status(200).json({
      message: "Member IDs generated successfully",
      members: clan.members,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "An error occurred while generating member IDs",
      error: error.message,
    });
  }
};

// Array of names
const names = [
  "Uche Ifudu",
  "Obina Ubachukwu",
  "Hamzat Ibrahim",
  "Osahon Osa",
  "Williams Ukokobili",
  "Mr Braide",
  "Onyekachi Opara",
  "Emmanuel Okon",
  "Samuel Okafor",
  "Chukwudi Goday",
  "Obiajulu Paulinus",
  "Ebuka Christ",
  "Bolade Richard",
  "Olayemi Musa",
  "Olabisi Oluwakemi",
  "Lana Anih",
  "Azobua E Okoduwa",
  "Iweta Tivere",
  "Otunba Osin (Idowu)",
  "Emmanuel Chalokwu (Emeka)",
  "CP Stella Akintade",
  "Bolaji Esho",
  "Bayo Ojo Olubanke",
  "Chidinma Okereke",
  "Patricia Iremiren",
  "Sunday Micah",
  "Pastor Philips",
  "Victor Adjei",
  "Lilian Chinoye",
  "Promise Damadan",
  "Peter Iloegbunam",
  "Markson Best Hembadoon",
  "Adebowale Joshua",
  "Innocecia Ugonna",
  "Ibrahim Danjuma",
  "Obijakwu",
  "Puri Mall Samuel",
  "Nanni Johnson",
  "Iwuoha Trajan's",
  "Mary Asianah",
  "Victor Danbiz",
  "Samuel Anate",
  "Onasanya Emmanuel",
  "Kemchuta Realestate",
  "Constance Okah",
  "Sir John Eriagbon",
  "Chukwu Eseogene",
  "Martin Abimbola",
  "Samson Ugbede",
  "David Lukpata",
  "Chinwe Yvonne",
  "Mngohol Barbs",
  "Chaimaka Onyejiafor",
  "Oluwatomisin Oyinade",
  "Alj Mufutau Tijani",
  "Cletus Okhuelegbe",
  "Alj Shakiru Olarewaju",
  "Christian Iwuoha",
  "Praise House Global Church",
  "Badiru Onome",
  "Macdonald Njoku",
  "Chukwemeka Frances",
  "Felix Ewansiha Osaigbovo",
  "Hassan Akwu",
  "Janson Cleaning",
  "Ijeoma Obijiaku",
  "Amarachi Edit",
  "Ogiefa-Barry Dan",
  "Amarachi Chukwu",
  "Emmanuel Edith",
  "Oghogho Osaigbovo",
  "Felix Ewansiha",
  "Babatala Jackson",
  "Onasanya Emmanuel",
  "Martina Getrude Nkem Kolam",
  "Chinenye Gloria Michelle Esoedo",
];

// Function to generate email from name
const generateEmail = (name) => {
  const firstTwoWords = name.split(" ").slice(0, 2).join(""); // Take the first two words and remove spaces
  return `${firstTwoWords.toLowerCase()}@mail.com`; // Convert to lowercase and append @mail.com
};

// Helper functions for generating memberCode

// Function to create users from the names array and add them to a clan
export const createUsersAndAddToClan = async (req, res) => {
  // const { clanId } = req.body; // Clan ID to add users to

  // let clanId = "67b1187e61243b230f3b9b21";
  let clanId = "67b1187e61243b230f3b9b21";

  try {
    // Step 1: Find the clan
    const clan = await Clan.findOne({
      $or: [{ _id: clanId }, { uniqueClanID: clanId }],
    });

    if (!clan) {
      return res.status(404).json({ message: "Clan not found" });
    }

    const createdUsers = [];

    // Step 2: Iterate through the names array
    for (const name of names) {
      // Generate email and password
      const email = generateEmail(name);
      const password = "123456789";

      // Check if the user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log(`User with email ${email} already exists. Skipping...`);
        continue;
      }

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Step 3: Create the user
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        roles: ["user"], // Default role
        isVerified: true,
      });

      await newUser.save();

      console.log({
        hdhd: newUser,
      });

      // const newUserProfile = new UserProfile({
      //   user: newUser._id,
      //   // Add default values for other fields if needed
      // });

      const newUserProfile = await UserProfile.create({
        user: newUser._id,
      });

      // Step 4: Generate the memberCode
      const lastMemberCode =
        clan.members.length > 0
          ? clan.members[clan.members.length - 1].memberCode
          : null;
      const memberCode = generateUniqueMemberID(
        clan.uniqueClanID,
        lastMemberCode
      );

      // Step 5: Add the user as a member of the clan
      clan.members.push({
        user: newUser._id,
        status: "approved", // Default status
        memberCode,
      });

      // Step 6: Update the user's clans array
      newUser.clans.push(clan._id);
      await newUser.save();

      createdUsers.push(newUser);
    }

    // Step 7: Save the updated clan
    await clan.save();

    // Step 8: Return the response
    res.status(201).json({
      message: "Users created and added to clan successfully",
      users: createdUsers,
      clan: clan,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "An error occurred while creating users and adding to clan",
      error: error.message,
    });
  }
};

export const approveAllMembersInClan = async (req, res) => {
  // const { clanId } = req.body; // Clan ID to approve members for
  let clanId = "67b1187e61243b230f3b9b21";
  try {
    // Step 1: Find the clan by uniqueClanID or _id
    const clan = await Clan.findOne({
      $or: [{ _id: clanId }, { uniqueClanID: clanId }],
    });

    if (!clan) {
      return res.status(404).json({ message: "Clan not found" });
    }

    // Step 2: Approve all members
    clan.members = clan.members.map((member) => ({
      ...member.toObject(), // Convert Mongoose document to plain object
      status: "approved", // Update status to "approved"
    }));

    // Step 3: Save the updated clan
    await clan.save();

    // Step 4: Return the response
    res.status(200).json({
      message: "All members in the clan have been approved",
      clan: clan,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "An error occurred while approving members",
      error: error.message,
    });
  }
};

export const deleteMembersWithMailDomain = async (req, res) => {
  // const { clanId } = req.body; // Clan ID to delete members from
  let clanId = "67b1187e61243b230f3b9b21";
  try {
    // Step 1: Find the clan by uniqueClanID or _id
    const clan = await Clan.findOne({
      $or: [{ _id: clanId }, { uniqueClanID: clanId }],
    }).populate("members.user", "email"); // Populate member emails

    if (!clan) {
      return res.status(404).json({ message: "Clan not found" });
    }

    // Step 2: Filter members whose emails end with @mail.com
    const membersToDelete = clan.members.filter((member) =>
      member.user.email.endsWith("@mail.com")
    );

    // Step 3: Delete users and their profiles
    for (const member of membersToDelete) {
      // Delete the user profile
      await UserProfile.findOneAndDelete({ user: member.user._id });

      // Delete the user
      await User.findByIdAndDelete(member.user._id);
    }

    // Step 4: Remove the members from the clan
    clan.members = clan.members.filter(
      (member) => !member.user.email.endsWith("@mail.com")
    );

    // Step 5: Save the updated clan
    await clan.save();

    // Step 6: Return the response
    res.status(200).json({
      message: "Members with @mail.com emails deleted successfully",
      deletedMembers: membersToDelete,
      clan: clan,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "An error occurred while deleting members",
      error: error.message,
    });
  }
};

// import Clan from "../models/clan.js"; // Adjust the path to your Clan model

export const getAllClanMembers = async (req, res) => {
  // const { clanId } = req.params; // Clan ID from request parameters
  let clanId = "67b1187e61243b230f3b9b21";
  try {
    // Step 1: Find the clan and populate the members.user field
    const clan = await Clan.findOne({
      $or: [{ _id: clanId }, { uniqueClanID: clanId }],
    }).populate({
      path: "members.user",
      select: "name email", // Only select name and email
    });

    if (!clan) {
      return res.status(404).json({ message: "Clan not found" });
    }

    // Step 2: Extract member details (name and email)
    const members = clan.members.map((member) => ({
      name: member.user.name,
      email: member.user.email,
      status: member.status, // Optional: Include member status
      memberCode: member.memberCode, // Optional: Include member code
    }));

    // Step 3: Return the response
    res.status(200).json({
      message: "Members retrieved successfully",
      members: members,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "An error occurred while retrieving members",
      error: error.message,
    });
  }
};
