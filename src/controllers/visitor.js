import PhysicalDeviceClan from "../models/PhysicalDeviceClan.js";
import UserProfile from "../models/profile.js";
import VisitorInvitation from "../models/visitor.js";
import { sendGPassCode } from "../services/deviceService.js";
import { sendNotification } from "../services/PushnotificationSevice.js";

// export const generateAccessCode = async (req, res) => {
//   try {
//     const { visitor_name, gender, phone_number, expires, location, address } =
//       req.body;
//     let user = req.user;
//     let clanId = req.clan._id;

//     const uniqueAccessCode = generateUniqueAccessCode();

//     const invitation = new VisitorInvitation({
//       clan: clanId,
//       creator: req.user._id,
//       access_code: uniqueAccessCode,
//       visitor_name,
//       gender,
//       phone_number,
//       expires,
//       location,
//     });

//     await invitation.save();

//     const userProfile = await UserProfile.findOne({ user: user._id });

//     let tokedata = [userProfile.pushtoken]; // pushToken; ///  "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"; // Replace with actual token
//     let title = "Invitation Sent!"; // "Test Notification";
//     let body = `✅ You just sent an invitation to ${invitation.visitor_name} (${invitation.gender}) at ${invitation.location}. Access code: ${invitation.access_code}. Status: ${invitation.status}.`;

//     let datas = {
//       userId: user._id.toString(),
//     };
//     const tickets = await sendNotification(tokedata, title, body, datas);
//     res.status(201).json({ success: true, invitation, tickets });
//   } catch (error) {
//     console.error("Error generating access code:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

export const generateAccessCode = async (req, res) => {
  try {
    const { visitor_name, gender, phone_number, expires, location, address } =
      req.body;
    let user = req.user;
    let clanId = req.clan._id;

    // Check if clan has a physical device

    // Check for physical device
    const physicalDevice = await PhysicalDeviceClan.findOne({ clan: clanId });

    const accessCode = physicalDevice
      ? generateSixDigitCode()
      : generateUniqueAccessCode();

    // PHYSICAL DEVICE FLOW
    if (physicalDevice) {
      if (!clanId) {
        return res.status(400).json({
          success: false,
          message: "Estate ID is required for physical access",
        });
      }

      const gpassResult = await sendGPassCode(
        physicalDevice.estateCode,
        accessCode
      );
      if (!gpassResult.success) {
        return res.status(400).json({
          success: false,
          message: "Physical access system rejected the code",
        });
      }
    }
    // NON-PHYSICAL FLOW (skips GPass verification)

    // COMMON SAVE OPERATION (only reaches here if physical verification passed or non-physical)

    const invitation = new VisitorInvitation({
      clan: clanId,
      creator: req.user._id,
      access_code: accessCode,
      visitor_name,
      gender,
      phone_number,
      expires,
      location,
    });

    await invitation.save();

    const userProfile = await UserProfile.findOne({ user: user._id });

    let tokedata = [userProfile.pushtoken]; // pushToken; ///  "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"; // Replace with actual token
    let title = "Invitation Sent!"; // "Test Notification";
    let body = `✅ You just sent an invitation to ${invitation.visitor_name} (${invitation.gender}) at ${invitation.location}. Access code: ${invitation.access_code}. Status: ${invitation.status}.`;

    let datas = {
      userId: user._id.toString(),
    };
    const tickets = await sendNotification(tokedata, title, body, datas);
    res.status(201).json({ success: true, invitation, tickets });
  } catch (error) {
    console.error("Error generating access code:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
export const cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = await VisitorInvitation.findById(invitationId);
    if (!invitation) {
      return res
        .status(404)
        .json({ success: false, message: "Invitation not found." });
    }

    // Check if the authenticated user is the creator or an clan admin
    const isAdmin = req.user.roles && req.user.roles.includes("admin");
    if (
      !(invitation.creator.toString() === req.user._id.toString() || isAdmin)
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to cancel this invitation.",
      });
    }

    await VisitorInvitation.findByIdAndDelete(invitationId);

    res.json({ success: true, message: "Invitation canceled successfully." });
  } catch (error) {
    console.error("Error canceling invitation:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const modifyInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { visitor_name, gender, phone_number, expires, isValid } = req.body;

    const invitation = await VisitorInvitation.findById(invitationId);
    if (!invitation) {
      return res
        .status(404)
        .json({ success: false, message: "Invitation not found." });
    }

    // Check if the authenticated user is the creator of the invitation
    if (invitation.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to modify this invitation.",
      });
    }

    // Update invitation fields
    invitation.visitor_name = visitor_name || invitation.visitor_name;
    invitation.gender = gender || invitation.gender;
    invitation.phone_number = phone_number || invitation.phone_number;
    invitation.expires = expires || invitation.expires;
    invitation.isValid = isValid || invitation.isValid;

    await invitation.save();

    res.json({ success: true, invitation });
  } catch (error) {
    console.error("Error modifying invitation:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyAccessCode = async (req, res) => {
  try {
    const { accessCode } = req.body;
    // const { clanId } = req.params;
    let clanId = req.clan._id;

    // Check if the access code exists
    const invitation = await VisitorInvitation.findOne({
      access_code: accessCode,
    });

    if (!invitation) {
      return res
        .status(401)
        .json({ success: false, message: "Access code not valid" });
    }

    const userProfile = await UserProfile.findOne({ user: invitation.creator });
    // Check if the access code is associated with the correct clan(estate)
    if (invitation.clan.toString() === clanId.toString()) {
      const currentTime = new Date().getTime();

      // check if the access code has expired
      if (currentTime > invitation.expires.getTime()) {
        console.log(`Access ${accessCode} has expired`);
        await VisitorInvitation.findByIdAndUpdate(invitation._id, {
          $set: { isValid: false },
        });
        if (userProfile && userProfile.pushtoken) {
          let tokenData = [userProfile.pushtoken];
          let title = "Access Code Expired!";
          let body = `❌ The access code ${invitation.access_code} for ${invitation.visitor_name} has expired.`;
          let datas = {
            userId: invitation.creator.toString(),

            invitationId: invitation._id.toString(), // Include invitation ID for context
          };
          await sendNotification(tokenData, title, body, datas);
        }
        return res
          .status(401)
          .json({ success: false, message: "Access code has expired" });
      }

      if (userProfile && userProfile.pushtoken) {
        let tokenData = [userProfile.pushtoken];
        let title = "Access Code Confirmed!";
        let body = `✅ Access code ${invitation.access_code} for ${invitation.visitor_name} is confirmed!`; // Status: ${invitation.status}.`;
        let datas = {
          userId: invitation.creator.toString(),
          invitationId: invitation._id.toString(), // Include invitation ID for context
        };
        await sendNotification(tokenData, title, body, datas);
      }

      return res.json({
        success: true,
        message: "Access code confirmed!",
        invitation,
        userProfile,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Access code is not correct for the specified clan",
      });
    }
  } catch (error) {
    console.error("Error verifying access code:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getAllClanInvites = async (req, res) => {
  try {
    // Access the clan data from checkClanAdmin middleware
    const clan = req.clan;
    console.log(clan);

    // Query parameters
    const { startDate, endDate } = req.query;

    const query = { clan: clan._id };

    // Apply filters based on startDate and endDate
    if (startDate && endDate) {
      query.expires = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Fetch clan invites sorted by latest created first
    const clanInvites = await VisitorInvitation.find(query).sort({
      createdAt: -1,
    });

    res.json({ success: true, clanInvites });
  } catch (error) {
    console.error("Error fetching clan invites:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Controller function for getting all invitations for a user (accessible by the creator only)
export const getAllUserInvites = async (req, res) => {
  try {
    const userId = req.user._id;

    const { page, limit, startDate, endDate } = req.query;

    const query = { creator: userId };

    // Apply filters based on startDate and endDate
    if (startDate && endDate) {
      query.expires = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Implement pagination with skip and limit
    const options = {
      skip: page ? parseInt(page) - 1 : 0,
      limit: limit ? parseInt(limit) : 10000000000000000000000000,
    };

    const userInvites = await VisitorInvitation.find(query, null, options).sort(
      {
        createdAt: -1,
      }
    );

    res.json({ success: true, userInvites });
  } catch (error) {
    console.error("Error fetching user invites:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get invitation by ID
export const getInvitationById = async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = await VisitorInvitation.findById(invitationId);

    if (!invitation) {
      return res
        .status(404)
        .json({ success: false, message: "Invitation not found." });
    }

    const userId = req.user._id;

    // Check if the user is the invitation creator or a clan admin
    const isCreator = invitation.creator.toString() === userId.toString();

    if (!isCreator) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to access this invitation.",
      });
    }

    res.json({ success: true, invitation });
  } catch (error) {
    console.error("Error fetching invitation by ID:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateUniqueAccessCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const generateSixDigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
