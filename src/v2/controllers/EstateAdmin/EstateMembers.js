import { log } from "console";
import clan from "../../../models/clan.js"; // Adjust the path as necessary
import UserProfile from "../../../models/profile.js";

// export const Approve_Suspend_Member = async (req, res) => {
//   try {
//     const clanId = req.claninfo?._id;

//     // const requestingUserId = req.user._id; // Example: get from JWT token

//     // if (!requestingUserId) {
//     //   return res
//     //     .status(401)
//     //     .json({ message: "Not authorized, no user ID provided" });
//     // }

//     const clandata = await clan.findById(clanId);

//     if (!clandata) {
//       return res.status(404).json({ message: "Clan not found" });
//     }

//     const { newStatus, memberUserId } = req.body;

//     // 1. Validate newStatus
//     const allowedStatuses = ["pending", "approved", "rejected", "suspended"];
//     if (!allowedStatuses.includes(newStatus)) {
//       return res.status(400).json({ message: "Invalid status provided." });
//     }
//     // 3. Find the member within the clan's members array
//     const memberIndex = clandata.members.findIndex(
//       (member) => member.user.toString() === memberUserId
//     );

//     if (memberIndex === -1) {
//       return res
//         .status(404)
//         .json({ message: "Member not found in this clan." });
//     }

//     const currentMember = clandata.members[memberIndex];
//     const oldStatus = currentMember.status;
//     clandata.members[memberIndex].status = newStatus;

//     // 5. Conditional UserProfile update if status changes to "approved"
//     if (newStatus === "approved" && oldStatus !== "approved") {
//       const userProfile = await UserProfile.findOne({ user: memberUserId });

//       if (userProfile) {
//         userProfile.currentClanMeeting = clandata;
//         console.log({
//           vvv: userProfile,
//         });
//         await userProfile.save();
//         console.log(
//           `UserProfile for user ${memberUserId} updated with currentClanMeeting: ${clanId}`
//         );
//       } else {
//         // Handle case where UserProfile might not exist for the member
//         console.warn(
//           `UserProfile not found for user ${memberUserId}. Cannot update currentClanMeeting.`
//         );
//       }
//     }

//     await clandata.save();

//     res.status(200).json({
//       message: "Clan member status updated successfully.",
//       clan: clandata,
//       updatedMember: clandata.members[memberIndex],
//     });

//     // res.json({ success: true, currentMember, oldStatus, clandata });
//   } catch (error) {
//     console.error("Error fetching user invites:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

export const Approve_Suspend_Member = async (req, res) => {
  try {
    // Assuming req.claninfo?._id is correctly populated by a preceding middleware
    // that fetches clan information based on the route or user context.
    const clanId = req.claninfo?._id;

    if (!clanId) {
      return res
        .status(400)
        .json({ message: "Clan ID is missing from request context." });
    }

    const clandata = await clan.findById(clanId);

    if (!clandata) {
      return res.status(404).json({ message: "Clan not found." });
    }

    const { newStatus, memberUserId } = req.body;

    // 1. Validate newStatus
    const allowedStatuses = ["pending", "approved", "rejected", "suspended"];
    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({ message: "Invalid status provided." });
    }

    // 2. Find the member within the clan's members array
    const memberIndex = clandata.members.findIndex(
      (member) => member.user.toString() === memberUserId
    );

    if (memberIndex === -1) {
      return res
        .status(404)
        .json({ message: "Member not found in this clan." });
    }

    const currentMember = clandata.members[memberIndex];
    const oldStatus = currentMember.status;

    // 3. Update the member's status in the clan
    clandata.members[memberIndex].status = newStatus;

    let updatedUserProfile = null; // Initialize to null

    // 4. Conditional UserProfile update if status changes to "approved"
    if (newStatus === "approved" && oldStatus !== "approved") {
      const userProfile = await UserProfile.findOne({ user: memberUserId });

      if (userProfile) {
        // CORRECTED: Assign clanId (ObjectId) directly, not the whole clan object
        userProfile.currentClanMeeting = clandata;
        await userProfile.save();
        updatedUserProfile = userProfile; // Store the updated profile for the response
        console.log(
          `UserProfile for user ${memberUserId} updated with currentClanMeeting: ${clanId}`
        );
      } else {
        console.warn(
          `UserProfile not found for user ${memberUserId}. Cannot update currentClanMeeting.`
        );
      }
    }
    
    else if (newStatus !== "approved" && oldStatus === "approved") {
      // Optional: If status changes from "approved" to something else, clear currentClanMeeting
      const userProfile = await UserProfile.findOne({ user: memberUserId });
      if (
        userProfile &&
        userProfile.currentClanMeeting &&
        userProfile.currentClanMeeting.toString() === clanId.toString()
      ) {
        userProfile.currentClanMeeting = null;
        await userProfile.save();
        updatedUserProfile = userProfile; // Store the updated profile for the response
        console.log(
          `UserProfile for user ${memberUserId} cleared currentClanMeeting.`
        );
      }
    }

    // 5. Save the updated Clan document
    await clandata.save();

    // 6. Send the response with the updated clan, member, and user profile
    res.status(200).json({
      message: "Clan member status updated successfully.",
      clan: clandata,
      updatedMember: clandata.members[memberIndex],
      userProfile: updatedUserProfile, // Include the updated user profile in the response
    });
  } catch (error) {
    console.error("Error in Approve_Suspend_Member:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
