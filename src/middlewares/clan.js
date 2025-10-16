// authMiddleware.js
import User from "../models/user.js";
import Clan from "../models/clan.js";
import UserProfile from "../models/profile.js";

export const checkClanAdmin = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    const { clanId } = req.params;
    const clan = await Clan.findById(clanId);

    if (!clan) {
      return res.status(404).json({ success: false, error: "Clan not found." });
    }

    // Check if the user is a clan admin
    const isAdmin = clan.admins.some(
      (admin) => admin.user.toString() === userId.toString()
    );

    if (isAdmin) {
      req.clan = clan;
      console.log(req.clan);
      next();
    } else {
      return res
        .status(403)
        .json({ success: false, error: "User is not a clan admin." });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const checkClan_IsAproved_and_MemberAproved = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const clanId = req.params.clanId;
    const clan = await Clan.findById(clanId);

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!clan) {
      return res.status(404).json({ success: false, error: "Clan not found." });
    }

    if (clan.status !== "approved") {
      return res.status(403).json({ message: "Clan is not approved." });
    }

    const member = clan.members.find((member) => member.user.equals(userId));
    if (!member) {
      return res
        .status(403)
        .json({ message: "User is not a member of the clan." });
    }

    // Check if the member status is 'approved'
    if (member.status !== "approved") {
      return res
        .status(403)
        .json({ message: "User is not an approved member of the clan." });
    }

    req.clan = clan;
    next();
  } catch (error) {
    console.log({
      error: error.message,
    });
    return res.status(500).json({ success: false, error: error.message });
  }
};

// checkClan_IsAproved_and_MemberAproved  and  checkClan_IsAproved_and_MemberAproved__withoutParams  are same just change the name and parram

export const check_User_is_Admins_of_clan = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user is an admin of any clan
    // const clans = await Clan.find({ "admins.user": existingUser?._id });

    const clans = await Clan.find({ "admins.user": existingUser._id })
      .populate("creator", "name") // Populate creator details
      .populate("admins.user", "name") // Populate admin details
      .populate("members.user", "name email");
    if (clans.length > 0) {
      req.clans = clans; // Attach the clans to the request object
      next();
    } else {
      return res
        .status(403)
        .json({ success: false, error: "User is not an admin of any clan." });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const checkClan_IsApproved_and_MemberApproved_Admin = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user._id;
    console.log({
      ssssuserId: userId,
    });

    const clanId = req.params.clanId;
    const clan = await Clan.findById(clanId);

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!clan) {
      return res.status(404).json({ success: false, error: "Clan not found." });
    }

    if (clan.status !== "approved") {
      return res.status(403).json({ message: "Clan is not approved." });
    }

    const isAdmin = clan.members.find((admin) => admin.user.equals(userId));
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "User is not a member of the clan." });
    }

    req.clan = clan;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// this check if the clan is aproved and the member of a clan is also an admin of the clan

export const checkClan_IsAproved_and_MemberAproved_noParams = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user._id;
    console.log("from clan middle", req.user);

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const userprofile = await UserProfile.findOne({ user: userId });

    const clan = await Clan.findById(userprofile.currentClanMeeting);

    if (!clan) {
      return res.status(404).json({ success: false, error: "Clan not found." });
    }

    if (clan.status !== "approved") {
      return res.status(403).json({ message: "Clan is not approved." });
    }

    const member = clan.members.find((member) => member.user.equals(userId));
    if (!member) {
      return res
        .status(403)
        .json({ message: "User is not a member of the clan." });
    }

    // Check if the member status is 'approved'
    if (member.status !== "approved") {
      return res
        .status(403)
        .json({ message: "User is not an approved member of the clan." });
    }

    req.clan = clan;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
// this allow you to check if the user is an Aproved member of the clan it does not expoect a parameter like the checkClan_IsAproved_and_MemberAproved

export const checkClan_IsAproved_and_UserAnAdmin_noParams = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user._id;
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const userprofile = await UserProfile.findOne({ user: userId });

    console.log({
      userprofile: userprofile,
    });
    const clan = await Clan.findById(
      userprofile.AdmincurrentClanMeeting
    ).populate("members.user", "name email");
    if (!clan) {
      return res.status(404).json({ success: false, error: "Clan not found." });
    }

    if (clan.status !== "approved") {
      return res.status(403).json({ message: "Clan is not approved." });
    }

    const admin = clan.admins.find((admin) => admin.user.equals(userId));
    if (!admin) {
      return res
        .status(403)
        .json({ message: "User is not a member of the clan." });
    }

    // Check if the member status is 'approved'
    // if (member.status !== "approved") {
    //   return res
    //     .status(403)
    //     .json({ message: "User is not an approved member of the clan." });
    // }

    req.clan = clan;

    next();
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}; // this allow you to check if the user is an Aproved member of the clan it does not expoect a parameter like the checkClan_IsAproved_and_MemberAproved
