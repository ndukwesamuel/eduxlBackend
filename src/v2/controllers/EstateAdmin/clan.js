import Clan from "../../../models/clan.js"; // Adjust the path to your Clan model
import { validationResult } from "express-validator";
import Household from "../../../models/household.js";
import User from "../../../models/user.js";
import mongoose from "mongoose";
import ClanWallet from "../../../models/ClanWallet.js";
import Due from "../../../models/Due.js";
import serviceVendor from "../../../models/serviceVendor.js";
import UserProfile from "../../../models/profile.js";
import wallet from "../../../models/wallet.js";
import { hashPassword } from "../../../helpers/auth.js";
import { generateNextMemberCode } from "../SuperAdmin/clan.js";
import ClanWithdrawal from "../../../models/ClanWithdrawal.js";
import VirtualAccount from "../../../models/VirtualAccount.js";

// import { hashPassword } from "../../helpers/auth.js";
// import { generateNextMemberCode } from "./SuperAdmin/clan.js";

// Get all members of a clan
export const getAllMembers_fake = async (req, res) => {
  try {
    const { clanId } = req.params;

    // Find the clan and populate the members and admins
    const clan = await Clan.findById(clanId)
      .populate("members.user", "name email")
      .populate("admins.user", "name email");

    if (!clan) {
      return res.status(404).json({ error: "Clan not found" });
    }

    // Map members and include admin level if applicable
    const members = clan.members.map((member) => {
      const isAdmin = clan.admins.find(
        (admin) => admin.user._id.toString() === member.user._id.toString()
      );

      return {
        _id: member.user._id,
        name: member.user.name,
        email: member.user.email,
        status: member.status,
        homeAddress: member.homeAddress,
        phonenumber: member.phonenumber,
        memberCode: member.memberCode,
        flatNumber: member.flatNumber,
        street: member.street,
        apartmentType: member.apartmentType,
        isAdmin: !!isAdmin,
        adminLevel: isAdmin ? isAdmin.level : null,
      };
    });

    res.status(200).json({ members });
  } catch (err) {
    console.error("Error fetching members:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// // --- Assume this is at the top of your getAllMembers file ---
// import Clan from "./models/Clan"; // Assuming your Clan model is imported
// import VirtualAccount from "./models/VirtualAccount"; // Import the VirtualAccount model
// // -----------------------------------------------------------

export const getAllMembers = async (req, res) => {
  try {
    const { clanId } = req.params;

    // Find the clan and populate the members and admins
    // NOTE: Keep the existing population for user details
    const clan = await Clan.findById(clanId)
      .populate("members.user", "name email")
      .populate("admins.user", "name email");

    if (!clan) {
      return res.status(404).json({ error: "Clan not found" });
    }

    // --- 1. Fetch all required Virtual Accounts in one query ---
    const userIds = clan.members.map((member) => member.user._id);
    const virtualAccounts = await VirtualAccount.find({
      user: { $in: userIds },
    });

    // --- 2. Create a Map for easy lookup of virtual accounts ---
    const virtualAccountMap = new Map();
    virtualAccounts.forEach((va) => {
      // Use the user ID as the key
      virtualAccountMap.set(va.user.toString(), va);
    });
    // ----------------------------------------------------------

    // Map members and include admin level and VIRTUAL ACCOUNT details
    const members = clan.members.map((member) => {
      const userIdString = member.user._id.toString();

      const isAdmin = clan.admins.find(
        (admin) => admin.user._id.toString() === userIdString
      );

      // --- 3. Lookup the Virtual Account from the map ---
      const virtualAccount = virtualAccountMap.get(userIdString);

      return {
        _id: member.user._id,
        name: member.user.name,
        email: member.user.email,
        status: member.status,
        homeAddress: member.homeAddress,
        phonenumber: member.phonenumber,
        memberCode: member.memberCode,
        flatNumber: member.flatNumber,
        street: member.street,
        apartmentType: member.apartmentType,
        isAdmin: !!isAdmin,
        adminLevel: isAdmin ? isAdmin.level : null,

        // --- 4. Add the Virtual Account details ---
        virtualAccount: virtualAccount
          ? {
              providerReference: virtualAccount.providerReference,
              accountName: virtualAccount.accountName,
              accountNumber: virtualAccount.accountNumber,
              bankName: virtualAccount.bankName,
              currency: virtualAccount.currency,
            }
          : null,
      };
    });

    res.status(200).json({ members });
  } catch (err) {
    console.error("Error fetching members:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllMembersFake = async (req, res) => {
  try {
    // const { clanId } = req.params;
    const clanId = "6807bbbf6152e3e0bb049580"; // Your hardcoded clanid

    // Find the clan and populate the members and admins
    // NOTE: Keep the existing population for user details
    const clan = await Clan.findById(clanId)
      .populate("members.user", "name email")
      .populate("admins.user", "name email");

    if (!clan) {
      return res.status(404).json({ error: "Clan not found" });
    }

    // --- 1. Fetch all required Virtual Accounts in one query ---
    const userIds = clan.members.map((member) => member.user._id);
    const virtualAccounts = await VirtualAccount.find({
      user: { $in: userIds },
    });

    // --- 2. Create a Map for easy lookup of virtual accounts ---
    const virtualAccountMap = new Map();
    virtualAccounts.forEach((va) => {
      // Use the user ID as the key
      virtualAccountMap.set(va.user.toString(), va);
    });
    // ----------------------------------------------------------

    // Map members and include admin level and VIRTUAL ACCOUNT details
    const members = clan.members.map((member) => {
      const userIdString = member.user._id.toString();

      const isAdmin = clan.admins.find(
        (admin) => admin.user._id.toString() === userIdString
      );

      // --- 3. Lookup the Virtual Account from the map ---
      const virtualAccount = virtualAccountMap.get(userIdString);

      return {
        _id: member.user._id,
        name: member.user.name,
        email: member.user.email,
        status: member.status,
        homeAddress: member.homeAddress,
        phonenumber: member.phonenumber,
        memberCode: member.memberCode,
        flatNumber: member.flatNumber,
        street: member.street,
        apartmentType: member.apartmentType,
        isAdmin: !!isAdmin,
        adminLevel: isAdmin ? isAdmin.level : null,

        // --- 4. Add the Virtual Account details ---
        virtualAccount: virtualAccount
          ? {
              providerReference: virtualAccount.providerReference,
              accountName: virtualAccount.accountName,
              accountNumber: virtualAccount.accountNumber,
              bankName: virtualAccount.bankName,
              currency: virtualAccount.currency,
            }
          : null,
      };
    });

    res.status(200).json({ members });
  } catch (err) {
    console.error("Error fetching members:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Edit a member's details
// export const editMember = async (req, res) => {
//   try {
//     const { clanId } = req.params;
//     const { homeAddress, phonenumber, memberId } = req.body;

//     // Find the clan
//     const clan = await Clan.findById(clanId);
//     if (!clan) {
//       return res.status(404).json({ error: "Clan not found" });
//     }

//     // Find the member in the clan
//     const memberIndex = clan.members.findIndex(
//       (member) => member.user.toString() === memberId
//     );

//     if (memberIndex === -1) {
//       return res.status(404).json({ error: "Member not found in this clan" });
//     }

//     // Update member details
//     clan.members[memberIndex].homeAddress = homeAddress;
//     clan.members[memberIndex].phonenumber = phonenumber;
//     await clan.save();

//     res.status(200).json({
//       message: "Member updated successfully",
//       member: clan.members[memberIndex],
//     });
//   } catch (err) {
//     console.error("Error updating member:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

export const editMember = async (req, res) => {
  try {
    const { clanId } = req.params;
    const {
      homeAddress,
      phonenumber,
      memberId,
      flatNumber,
      street,
      apartmentType,
    } = req.body;

    // Find the clan
    const clan = await Clan.findById(clanId);
    if (!clan) {
      return res.status(404).json({ error: "Clan not found" });
    }

    // Find the member in the clan
    const memberIndex = clan.members.findIndex(
      (member) => member.user.toString() === memberId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ error: "Member not found in this clan" });
    }

    // Update common member details
    clan.members[memberIndex].homeAddress = homeAddress;
    clan.members[memberIndex].phonenumber = phonenumber;

    // Check if this is happylandestate (you might want to use a better identifier)
    const isHappylandEstate = clan.email === "happylandestate1@gmail.com";

    // Update happylandestate specific fields if they exist
    if (isHappylandEstate) {
      clan.members[memberIndex].flatNumber = flatNumber;
      clan.members[memberIndex].street = street;
      clan.members[memberIndex].apartmentType = apartmentType;

      // Optionally create a structured address if needed
      clan.members[memberIndex].structuredAddress = {
        flatNumber,
        street,
        apartmentType,
        fullAddress: homeAddress, // Keep original as fallback
      };
    }

    await clan.save();

    console.log({
      member: clan.members[memberIndex],
    });

    res.status(200).json({
      message: "Member updated successfully",
      member: clan.members[memberIndex],
    });
  } catch (err) {
    console.error("Error updating member:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createRate = async (req, res) => {
  try {
    const { clanId } = req.params;
    const { name, amount, description, lastUpdatedBy } = req.body;

    // Validate clan exists
    const clan = await Clan.findById(clanId);
    if (!clan) {
      return res.status(404).json({ error: "Clan not found" });
    }

    // Check for duplicate rate name in the clan
    const existingRate = await Rate.findOne({ clan: clanId, name });
    if (existingRate) {
      return res
        .status(400)
        .json({ error: "Rate name already exists in this clan" });
    }

    const rate = await Rate.create({
      clan: clanId,
      name,
      amount,
      description,
      lastUpdatedBy,
    });

    res.status(201).json(rate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createHousehold = async (req, res) => {
  try {
    const { name, type, description, address, clanId } = req.body;

    // Validate clan exists
    const clan = await Clan.findById(clanId);
    if (!clan) {
      return res.status(404).json({ error: "Clan not found" });
    }

    const household = await Household.create({
      clan: clanId,
      name,
      type,
      description,
      address,
    });

    res.status(201).json(household);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllHouseholds = async (req, res) => {
  try {
    // const { clanId, userId } = req.params;

    const { clanId } = req.params;

    const households = await Household.find({
      clan: clanId,
      // "members.user": userId,
    }).populate("members.user", "name email");

    res.status(200).json({ households });
  } catch (error) {
    console.error("Error fetching user households:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSingleHouseholds = async (req, res) => {
  try {
    // const { clanId, userId } = req.params;

    const { id } = req.params;

    // console.log({
    //   kdkd: id,
    // });

    const households = await Household.findById(id).populate(
      "members.user",
      "name email"
    );

    res.status(200).json({ households });
  } catch (error) {
    console.error("Error fetching user households:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const addMemberToHousehold = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { users, householdId } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Users array is required" });
    }

    const household = await Household.findById(householdId).session(session);
    if (!household) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Household not found" });
    }

    const clan = await Clan.findById(household.clan).session(session);
    if (!clan) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Clan not found" });
    }

    for (const { user: userId, role } of users) {
      if (!userId || !role) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: "Each user must have userId and role" });
      }

      const foundUser = await mongoose
        .model("User")
        .findById(userId)
        .session(session);
      if (!foundUser) {
        await session.abortTransaction();
        return res.status(404).json({ message: `User not found: ${userId}` });
      }

      const isClanMember = clan.members.some(
        (member) =>
          member.user.toString() === userId && member.status === "approved"
      );

      if (!isClanMember) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: `User ${userId} is not an approved clan member` });
      }

      const alreadyInCurrent = household.members.some(
        (member) => member.user.toString() === userId
      );

      if (alreadyInCurrent) {
        continue;
      }

      const userHouseholds = await Household.find({
        clan: household.clan,
        "members.user": userId,
      }).session(session);

      for (const oldHouse of userHouseholds) {
        oldHouse.members = oldHouse.members.filter(
          (member) => member.user.toString() !== userId
        );
        await oldHouse.save({ session });
      }

      household.members.push({
        user: userId,
        role,
        joinedAt: new Date(),
      });
    }

    await household.save({ session });
    await session.commitTransaction();

    return res.status(201).json({
      message: "Members added successfully",
      household,
    });
  } catch (error) {
    try {
      await session.abortTransaction();
    } catch (abortErr) {
      console.error("Failed to abort transaction:", abortErr);
    }

    console.error("Error adding members:", error);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    session.endSession();
  }
};

export const removeMemberFromHousehold = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { householdId, userId } = req.params;

    // Check if household exists
    const household = await Household.findById(householdId).session(session);
    if (!household) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Household not found" });
    }

    // Check if user is in the household
    const memberIndex = household.members.findIndex(
      (member) => member.user.toString() === userId
    );

    if (memberIndex === -1) {
      await session.abortTransaction();
      return res
        .status(404)
        .json({ message: "User not found in this household" });
    }

    // Remove user from household
    household.members.splice(memberIndex, 1);
    await household.save({ session });

    await session.commitTransaction();
    res.status(200).json({
      message: "Member removed from household successfully",
      household,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error removing member from household:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    session.endSession();
  }
};

export const deleteHousehold = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { householdId } = req.params;

    // Check if household exists
    const household = await Household.findById(householdId).session(session);
    if (!household) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Household not found" });
    }

    // Check if household has any members
    if (household.members.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        message:
          "Cannot delete household with members. Remove all members first.",
      });
    }

    // Delete the household if no members
    await Household.findByIdAndDelete(householdId).session(session);

    await session.commitTransaction();
    res.status(200).json({
      message: "Household deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error deleting household:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    session.endSession();
  }
};

export const getAllmemeberNotInAnHousehold = async (req, res) => {
  try {
    const { clanId } = req.params;

    // Validate input
    if (!mongoose.Types.ObjectId.isValid(clanId)) {
      return res.status(400).json({ message: "Invalid clan ID" });
    }
    const households = await Household.find({ clan: clanId }).select(
      "members.user"
    );

    // Get all user IDs that are in any household of this clan
    const householdMemberIds = households.flatMap((household) =>
      household.members.map((member) => member.user.toString())
    );

    // Get all approved clan members
    const clan = await Clan.findById(clanId);

    if (!clan) {
      return res.status(404).json({ message: "Clan not found" });
    }

    const availableMembers = clan.members
      .filter(
        (member) =>
          member.user &&
          member.status === "approved" &&
          !householdMemberIds.includes(member.user._id.toString())
      )
      .map((member) => ({
        user: member.user,
        status: member.status,
        homeAddress: member.homeAddress,
        memberCode: member.memberCode,
        phonenumber: member.phonenumber,
      }));

    res.status(200).json({
      success: true,
      count: availableMembers.length,
      data: availableMembers,
      message: "Clan members fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching clan members not in household:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching clan members",
      error: error.message,
    });
  }
};

export const WebfetchClanWallet = async (req, res) => {
  try {
    // let clan = req.clan;
    const { clanId } = req.params;

    const clanwallet = await ClanWallet.findOne({ clan: clanId });
    return res.status(200).json({ clan: clanwallet });
  } catch (error) {
    res.status(500).json({ error: "Fetching error!" });
  }
};

export const createDue = async (req, res) => {
  try {
    // const { clanId } = req.params;

    const { serviceName, serviceDetails, amount, dueDate, members, clanId } =
      req.body;
    const adminId = req.user._id; // Assuming you get the logged-in admin's ID from authentication

    // Check if the clan exists
    const clan = await Clan.findById(clanId);
    if (!clan) {
      return res.status(404).json({ message: "Clan not found" });
    }

    // Ensure admin belongs to the clan
    const isAdmin = clan.admins.some(
      (admin) => admin.user.toString() === adminId
    );
    if (!isAdmin) {
      return res.status(403).json({
        message: "You are not authorized to create dues for this clan",
      });
    }

    // Ensure the members exist in the clan
    const filteredMembers = clan.members.filter((member) =>
      members.includes(member.user.toString())
    );

    if (filteredMembers.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid members selected for dues" });
    }

    // Create the due record
    const due = new Due({
      clan: clanId,
      serviceName,
      serviceDetails,
      amount,
      dueDate,
      membersToPay: filteredMembers.map((member) => ({
        user: member.user,
        status: "pending",
      })),
      createdBy: adminId,
    });

    await due.save();
    res.status(201).json({
      message: "Due created successfully",
      due,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating due", error: error.message });
  }
};

export const WebClanAdmingetDues = async (req, res) => {
  try {
    // let clanId = req.clan._id;

    const { clanId } = req.params;

    // Fetch all dues for the given clan
    const dues = await Due.find({ clan: clanId })
      .sort({ createdAt: -1 })
      .populate("clan", "name") // Populate clan name
      .populate("membersToPay.user", "name email") // Populate member details
      .populate("createdBy", "name email"); // Populate creator details

    console.log({
      fg: dues,
    });

    // if (!dues.length) {
    //   return res.status(404).json({ message: "No dues found for this clan" });
    // }

    res.status(200).json({ dues });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching dues", error: error.message });
  }
};

export const WebcreateServiceVendorAccount = async (req, res) => {
  try {
    const { clanId } = req.params;

    // 🔍 Check if the clan exists
    const clan = await Clan.findById(clanId);
    if (!clan) {
      return res.status(404).json({
        success: false,
        message: "Clan not found",
      });
    }
    const imageFile = req.file;

    const {
      FullName,
      about_me,
      address, // Can be string or object
      gender,
      phone_number,
      years_of_experience,
      opens,
      closes,
      nextOfKin,
      structuredAddress,
      workingDays,
    } = req.body;

    // 📷 Handle photo upload
    let photo = {};
    if (imageFile) {
      const imageResult = await cloudinary.uploader.upload(imageFile.path);
      photo = {
        url: imageResult.secure_url,
        photoPublicId: imageResult.public_id,
      };
    }

    // 📦 Prepare vendor data
    const vendorData = {
      FullName,
      about_me,
      photo,
      gender,
      phone_number,
      years_of_experience,
      opens,
      closes,
      clan: clan._id, // ✅ use actual clan ID
      address: structuredAddress ? undefined : address,
      structuredAddress:
        structuredAddress ||
        (typeof address === "string"
          ? {
              street: address,
              city: "",
              state: "",
              country: "Nigeria",
            }
          : undefined),
      nextOfKin: nextOfKin
        ? {
            fullName: nextOfKin.fullName,
            relationship: nextOfKin.relationship,
            phone: nextOfKin.phone,
            address: nextOfKin.address,
          }
        : undefined,
      workingHours: {
        opens,
        closes,
        workingDays: workingDays || [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
      },
    };

    const newVendor = new serviceVendor(vendorData);
    const savedVendor = await newVendor.save();

    // res.status(201).json({
    //   success: true,
    //   message: "Vendor account created successfully",
    //   vendor: req.file, //savedVendor,
    // });

    res.status(201).json({
      success: true,
      message: "Vendor account created successfully",
      vendor: savedVendor,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create vendor account",
      errMsg: error.message,
    });
  }
};

export const getClanMemberProfiles = async (req, res) => {
  try {
    const { clanId, userId } = req.params;

    // 1. Find the clan and check if the user is a member
    const clan = await Clan.findOne({
      _id: clanId,
      "members.user": userId,
    });

    if (!clan) {
      return res.status(404).json({ message: "Clan or member not found" });
    }

    // 2. Extract the specific member's data
    const member = clan.members.find((m) => m.user?.equals(userId));

    if (!member || !member.user) {
      return res.status(404).json({ message: "Member not found in clan" });
    }

    const profile = await UserProfile.findOne({ user: userId }).populate({
      path: "user",
      select: "-password -__v -tokens", // Exclude sensitive fields
    });

    res.status(200).json({
      success: true,
      data: {
        id: profile.user._id,
        name: profile.user.name,
        email: profile.user.email,
        photo: profile.photo,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
        member,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateMemberStatus = async (req, res) => {
  const { clanId, memberId } = req.params;
  const { status } = req.body;

  // Validate status
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // const clan = await Clan.findById(clanId).session(session);
    // if (!clan) {
    //   throw new Error("Clan not found");
    // }

    // const memberIndex = clan.members.findIndex(
    //   (m) => m.user.toString() === memberId
    // );

    // if (memberIndex === -1) {
    //   throw new Error("Member not found in this clan");
    // }

    // // For approval
    // if (status === "approved") {
    //   // Generate member code if not exists
    //   if (!clan.members[memberIndex].memberCode) {
    //     clan.members[memberIndex].memberCode = await generateNextMemberCode(
    //       clanId
    //     );
    //   }

    //   clan.members[memberIndex].status = "approved";
    // }
    // // For rejection
    // else if (status === "rejected") {
    //   // Remove member from clan
    //   clan.members.splice(memberIndex, 1);
    // }

    // await clan.save({ session });
    // await session.commitTransaction();

    res.status(200).json({
      message: `Member ${status === "approved" ? "approved" : "removed"}`,
      member: clan.members[memberIndex] || { _id: memberId },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Update member status error:", error);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const registerBulkUsersForEstate = async (req, res) => {
  const { clanId, users } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate input
    if (!clanId || !users || !Array.isArray(users)) {
      return res
        .status(400)
        .json({ error: "Clan ID and users array are required" });
    }

    const processedUsers = [];
    const skippedUsers = [];
    const MAX_BATCH_SIZE = 20;
    let currentBatch = [];

    const clan = await Clan.findById(clanId).session(session);
    if (!clan) {
      throw new Error("Clan not found");
    }

    // Get existing member information
    const existingMembers = clan.members || [];
    const existingMemberUserIds = new Set(
      existingMembers.map((m) => m.user.toString())
    );

    for (const [index, userData] of users.entries()) {
      const { name, email } = userData;

      // Skip if missing critical fields
      if (!name || !email) {
        skippedUsers.push({
          email: email || "missing",
          reason: "Missing name or email",
        });
        continue;
      }

      // Check if user already exists in the system
      const existingUser = await User.findOne({ email }).session(session);
      let userId;

      if (existingUser) {
        userId = existingUser._id;

        // Check if user is already in this clan
        if (existingMemberUserIds.has(userId.toString())) {
          skippedUsers.push({ email, reason: "Already a member of this clan" });
          continue;
        }
      } else {
        try {
          // Create new user only if they don't exist
          const hashedPassword = await hashPassword("123456789");
          const [user] = await User.create(
            [{ name, email, isVerified: true, password: hashedPassword }],
            { session }
          );
          userId = user._id;

          // Create user profile
          await UserProfile.create([{ user: userId }], { session });

          // Create wallet
          await wallet.create([{ user: userId }], { session });
        } catch (err) {
          skippedUsers.push({ email, reason: "Failed to create user" });
          continue;
        }
      }

      currentBatch.push({
        user: userId,
        status: "approved",
        createdAt: new Date(),
      });

      // Process batch when full or at end
      if (currentBatch.length >= MAX_BATCH_SIZE || index === users.length - 1) {
        try {
          await Clan.findByIdAndUpdate(
            clanId,
            { $push: { members: { $each: currentBatch } } },
            { session, new: true }
          );

          await User.updateMany(
            { _id: { $in: currentBatch.map((u) => u.user) } },
            { $addToSet: { clans: clanId } },
            { session }
          );

          processedUsers.push(...currentBatch);
          currentBatch = [];
        } catch (batchError) {
          await session.abortTransaction();
          return res.status(500).json({
            error: "Batch processing failed",
            details: batchError.message,
          });
        }
      }
    }

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      addedCount: processedUsers.length,
      skippedCount: skippedUsers.length,
      skippedUsers: skippedUsers.slice(0, 100), // Limit to 100 skipped users
      clan: clan.name,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      error: "Processing failed",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  } finally {
    session.endSession();
  }
};

// export const assignMemberCode = async (req, res) => {
//   try {
//     const { clanId, memberId } = req.body;

//     // 1. Find the clan
//     const clan = await Clan.findById(clanId);
//     if (!clan) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Clan not found" });
//     }

//     const member = clan.members.id(memberId);
//     if (!member) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Member not found in this clan" });
//     }

//     // 3. Check if member already has a code
//     if (member.memberCode) {
//       return res.status(400).json({
//         success: false,
//         message: "Member already has a code",
//         memberCode: member.memberCode,
//       });
//     }

//     // 4. Get all existing codes and find the highest one
//     const codedMembers = clan.members.filter((m) => m.memberCode);
//     const sortedCodes = codedMembers
//       .map((m) => m.memberCode)
//       .sort((a, b) => {
//         const [, alphaA, numA] = a.split("-");
//         const [, alphaB, numB] = b.split("-");
//         return alphaB.localeCompare(alphaA) || numB.localeCompare(numA);
//       });

//     const highestCode = sortedCodes[0] || null;
//     member.memberCode = generateNextMemberCode(clan.uniqueClanID, highestCode);
//     await clan.save();
//     return res.status(200).json({
//       success: true,
//       message: "Member code assigned successfully",
//       // memberCode: member.memberCode,
//       // memberId: member._id,
//       clanId: clan,
//     });
//   } catch (error) {
//     console.error("Error assigning member code:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

export const assignMemberCode = async (req, res) => {
  try {
    const { clanId, memberId } = req.body;

    // 1. Find the clan
    const clan = await Clan.findById(clanId);
    if (!clan) {
      return res
        .status(404)
        .json({ success: false, message: "Clan not found" });
    }

    // 2. Find the member
    const member = clan.members.id(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found in this clan",
      });
    }

    // 3. Check if member already has a code
    if (member.memberCode) {
      return res.status(400).json({
        success: false,
        message: "Member already has a code",
        memberCode: member.memberCode,
      });
    }

    // 4. Get the highest existing code
    const codedMembers = clan.members.filter((m) => m.memberCode);
    const sortedCodes = codedMembers
      .map((m) => m.memberCode)
      .sort((a, b) => {
        const [, alphaA, numA] = a.split("-");
        const [, alphaB, numB] = b.split("-");
        return alphaB.localeCompare(alphaA) || numB.localeCompare(numA);
      });

    const highestCode = sortedCodes[0] || null;

    // 5. Generate the new code (using synchronous version)
    member.memberCode = generateUniqueMemberID(clan.uniqueClanID, highestCode);

    // 6. Save the clan
    await clan.save();

    return res.status(200).json({
      success: true,
      message: "Member code assigned successfully",
      memberCode: member.memberCode,
      memberId: member._id,
      clanId: clan._id,
    });
  } catch (error) {
    console.error("Error assigning member code:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Keep these helper functions unchanged
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
      // 'Z'
      char = 65; // 'A'
      carry = 1;
    } else {
      carry = 0;
    }
    nextAlpha = String.fromCharCode(char) + nextAlpha;
  }
  return nextAlpha;
};

const generateUniqueMemberID = (clanID, lastMemberCode) => {
  if (!lastMemberCode) {
    const clanPrefix = clanID.split("-")[0];
    return `${clanPrefix}-AAAA-0001`;
  }

  const [, alpha, numeric] = lastMemberCode.split("-");
  const nextAlpha = numeric === "9999" ? getNextAlphaSequence(alpha) : alpha;
  const nextNumeric =
    numeric === "9999" ? "0001" : getNextNumericSequence(numeric);

  const clanPrefix = clanID.split("-")[0];
  return `${clanPrefix}-${nextAlpha}-${nextNumeric}`;
};

export const update_withdrawal_account_details = async (req, res) => {
  try {
    const userId = req.user;
    const { accountName, accountNumber, bankName, bankCode, clanId } = req.body;
    const clan_info = await Clan.findById(clanId);

    if (!clan_info) {
      return res.status(404).json({ success: false, error: "Clan not found." });
    }
    let withdrawalAccount = await ClanWithdrawal.findOne({ clan: clanId });

    if (!withdrawalAccount) {
      // Create a new ClanWithdrawal if none exists
      withdrawalAccount = await ClanWithdrawal.create({
        user: userId,
        clan: clanId,
        accountDetails: {
          accountName,
          accountNumber,
          bankName,
          bankCode,
        },
      });
    } else {
      // Check if clanId matches the one in DB
      if (withdrawalAccount.clan.toString() !== clanId) {
        return res.status(400).json({
          message:
            "You are trying to update account details for a different clan.",
        });
      }

      // Update account details
      withdrawalAccount.accountDetails.accountName = accountName;
      withdrawalAccount.accountDetails.accountNumber = accountNumber;
      withdrawalAccount.accountDetails.bankName = bankName;
      withdrawalAccount.accountDetails.bankCode = bankCode;

      await withdrawalAccount.save();
    }
    res.status(200).json(withdrawalAccount);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

export const withdrawal_account_history = async (req, res) => {
  try {
    const { clanId } = req.params;
    const withdrawalAccount = await ClanWithdrawal.findOne({
      clan: clanId,
      // user: userId
    });

    if (!withdrawalAccount) {
      return res.status(200).json({ message: "No_withdrawal_account" });
    }

    res.status(200).json(withdrawalAccount);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

export const withdrawal_money = async (req, res) => {
  try {
    const { amount, clanId } = req.body;

    // Check wallet balance
    const wallet = await ClanWallet.findOne({ clan: clanId });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    // Check if account is approved
    const withdrawalAccount = await ClanWithdrawal.findOne({
      clan: clanId,
    });

    if (!withdrawalAccount) {
      return res
        .status(400)
        .json({ message: "No approved withdrawal account" });
    }

    withdrawalAccount.withdrawalRequests.push({
      amount,
      status: "pending",
    });

    await withdrawalAccount.save();

    res.status(201).json(withdrawalAccount);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

export const ClanmakeMemberAdmin = async (req, res) => {
  try {
    const { clanId, userId, adminLevel = 1 } = req.body;

    // Validate required fields
    if (!clanId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Both clanId and userId are required",
      });
    }

    // Verify the adminLevel is valid
    if (![1, 2, 3, 4, 5].includes(Number(adminLevel))) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin level. Must be between 1 and 5",
      });
    }

    // Find the clan
    const clan = await Clan.findById(clanId);
    if (!clan) {
      return res.status(404).json({
        success: false,
        message: "Clan not found",
      });
    }

    // Convert userId to string for comparison
    const userIdStr = userId.toString();

    // Check if user is already an admin
    const isAlreadyAdmin = clan.admins.some(
      (admin) => admin.user.toString() === userIdStr
    );
    if (isAlreadyAdmin) {
      return res.status(400).json({
        success: false,
        message: "User is already an admin",
      });
    }

    // Check if user is a member of the clan
    const isMember = clan.members.some(
      (member) => member.user.toString() === userIdStr
    );

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: "User is not a member of this clan",
      });
    }

    // Add user to admins array
    clan.admins.push({
      user: userId,
      level: Number(adminLevel),
    });

    // Save the updated clan
    await clan.save();

    return res.status(200).json({
      success: true,
      message: "Member successfully promoted to admin",
      data: {
        clanId: clan._id,
        userId: userId,
        adminLevel: adminLevel,
      },
    });
  } catch (error) {
    console.error("Error in ClanmakeMemberAdmin:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your request",
      error: error.message,
    });
  }
};
