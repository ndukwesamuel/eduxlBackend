import VisitorInvitation from "../../../models/visitor.js"; //"../models/visitor.js";

export const AdminverifyAccessCode = async (req, res) => {
  try {
    const { accessCode } = req.body;
    const clan_info = req.clan;

    // // Check if the access code exists
    const invitation = await VisitorInvitation.findOne({
      access_code: accessCode,
      clan: clan_info._id,
    });

    if (!invitation) {
      return res
        .status(401)
        .json({ success: false, message: "Access code not valid" });
    }

    // Check if the access code is associated with the correct clan(estate)
    if (invitation.clan.toString() === clan_info._id.toString()) {
      const currentTime = new Date().getTime();

      // check if the access code has expired
      if (currentTime > invitation.expires.getTime()) {
        console.log(`Access ${accessCode} has expired`);
        await VisitorInvitation.findByIdAndUpdate(invitation._id, {
          $set: { isValid: false },
        });
        return res
          .status(401)
          .json({ success: false, message: "Access code has expired" });
      }

      // Update the invitation to mark the visitor as arrived
      const updatedInvitation = await VisitorInvitation.findByIdAndUpdate(
        invitation._id,
        {
          $set: {
            status: "arrived",
            arrived_at: new Date(),
            isValid: true, // Typically, an access code is invalid after first use
          },
        },
        { new: true }
      );

      return res.json({
        success: true,
        message: "Access code confirmed and visitor marked as arrived!",
        data: updatedInvitation,
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

export const estateGuestHistory = async (req, res) => {
  try {
    const clanId = req.claninfo._id;

    const visitorHistory = await VisitorInvitation.find({ clan: clanId })
      .populate("creator", "name email") // Populate creator, only fetch 'name' and 'email' fields
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    if (visitorHistory.length === 0) {
      return res.status(200).json({
        message: "No visitor history found for this clan.",
        visitorHistory: [],
      });
    }

    res.json({ success: true, visitorHistory });
  } catch (error) {
    console.error("Error fetching user invites:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
