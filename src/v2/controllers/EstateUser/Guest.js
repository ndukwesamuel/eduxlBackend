import { log } from "console";
import VisitorInvitation from "../../../models/visitor.js"; // "../models/visitor.js";

// export const modifyGuestInvitation = async (req, res) => {
//   try {
//     // const { invitationId } = req.params;
//     const updates = req.body;

//     // Find the invitation
//     const invitation = await VisitorInvitation.findById(updates.invitationId);
//     if (!invitation) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Invitation not found." });
//     }

//     // Authorization check
//     if (invitation.creator.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized to modify this invitation.",
//       });
//     }

//     // List of allowed fields to update
//     const allowedUpdates = [
//       "visitor_name",
//       "gender",
//       "phone_number",
//       "expires",
//       "location",
//       "status",
//     ];

//     // Track if any updates were made
//     let updatesMade = false;

//     // Apply updates to allowed fields
//     allowedUpdates.forEach((field) => {
//       if (updates.hasOwnProperty(field)) {
//         // For explicit null values, set to null/undefined
//         if (updates[field] === null) {
//           invitation[field] = undefined;
//           updatesMade = true;
//         }
//         // For actual values (including empty string or false)
//         else if (updates[field] !== undefined) {
//           invitation[field] = updates[field];
//           updatesMade = true;
//         }
//       }
//     });

//     // Special handling for status changes
//     if (updates.hasOwnProperty("status")) {
//       const newStatus = updates.status;
//       const currentStatus = invitation.status;

//       // Validate new status
//       if (!["pending", "arrived", "departed"].includes(newStatus)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid status value. Allowed: pending, arrived, departed",
//         });
//       }

//       // Handle status transitions
//       if (newStatus !== currentStatus) {
//         updatesMade = true;

//         switch (newStatus) {
//           case "arrived":
//             if (!invitation.arrived_at) {
//               invitation.arrived_at = new Date();
//             }
//             if (currentStatus === "departed") {
//               invitation.departed_at = undefined;
//             }
//             break;

//           case "departed":
//             if (currentStatus !== "arrived") {
//               return res.status(400).json({
//                 success: false,
//                 message: "Visitor must be in 'arrived' status before departing",
//               });
//             }
//             invitation.departed_at = new Date();
//             break;

//           case "pending":
//             invitation.arrived_at = undefined;
//             invitation.departed_at = undefined;
//             break;
//         }
//       }
//     }

//     // If no updates were made (no valid fields provided)
//     if (!updatesMade) {
//       return res.status(400).json({
//         success: false,
//         message: "No valid fields provided for update",
//         allowedFields: allowedUpdates,
//       });
//     }

//     // Save the updated invitation
//     await invitation.save();

//     res.json({
//       // success: true,
//       data: invitation,
//       message: "Invitation updated successfully",
//     });
//   } catch (error) {
//     console.error("Error modifying invitation:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while updating invitation",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

// export const modifyGuestInvitation = async (req, res) => {
//   try {
//     const updates = req.body;
//     const invitation = await VisitorInvitation.findById(updates.invitationId);

//     if (!invitation) {
//       return res.status(404).json({
//         success: false,
//         message: "Invitation not found.",
//       });
//     }

//     // Authorization check
//     if (invitation.creator.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized to modify this invitation.",
//       });
//     }

//     const allowedUpdates = [
//       "visitor_name",
//       "gender",
//       "phone_number",
//       "expires",
//       "location",
//       "status",
//     ];

//     let updatesMade = false;

//     // Handle regular field updates
//     allowedUpdates.forEach((field) => {
//       if (updates.hasOwnProperty(field) && updates[field] !== undefined) {
//         invitation[field] = updates[field];
//         updatesMade = true;
//       }
//     });

//     // Special handling for status changes and timestamps
//     if (updates.hasOwnProperty("status")) {
//       const newStatus = updates.status;
//       const currentStatus = invitation.status;

//       if (!["pending", "arrived", "departed"].includes(newStatus)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid status value. Allowed: pending, arrived, departed",
//         });
//       }

//       if (newStatus !== currentStatus) {
//         updatesMade = true;

//         // Clear both timestamps when resetting to pending
//         if (newStatus === "pending") {
//           invitation.arrived_at = undefined;
//           invitation.departed_at = undefined;
//         }
//         // Set arrived timestamp when status changes to arrived
//         else if (newStatus === "arrived") {
//           invitation.arrived_at = new Date();
//           // Clear departed timestamp if coming from departed status
//           if (currentStatus === "departed") {
//             invitation.departed_at = undefined;
//           }
//         }
//         // Set departed timestamp when status changes to departed
//         else if (newStatus === "departed") {
//           if (currentStatus !== "arrived") {
//             return res.status(400).json({
//               success: false,
//               message: "Visitor must be in 'arrived' status before departing",
//             });
//           }
//           invitation.departed_at = new Date();
//         }
//       }
//     }

//     if (!updatesMade) {
//       return res.status(400).json({
//         success: false,
//         message: "No valid fields provided for update",
//         allowedFields: allowedUpdates,
//       });
//     }

//     // Save and get the updated document with all fields
//     const updatedInvitation = await invitation.save();

//     // Explicitly select all fields including timestamps for the response
//     const responseData = await VisitorInvitation.findById(updatedInvitation._id)
//       .select("-__v") // Exclude version key
//       .lean();

//     res.json({
//       data: responseData,
//       message: "Invitation updated successfully",
//     });
//   } catch (error) {
//     console.error("Error modifying invitation:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while updating invitation",
//       error: error.message,
//     });
//   }
// };

// export const modifyGuestInvitation = async (req, res) => {
//   try {
//     const updates = req.body;
//     const invitation = await VisitorInvitation.findById(updates.invitationId);

//     if (!invitation) {
//       return res.status(404).json({
//         success: false,
//         message: "Invitation not found.",
//       });
//     }

//     // Authorization check
//     if (invitation.creator.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized to modify this invitation.",
//       });
//     }

//     const allowedUpdates = [
//       "visitor_name",
//       "gender",
//       "phone_number",
//       "expires",
//       "location",
//       "status",
//     ];

//     let updatesMade = false;

//     // Handle regular field updates
//     allowedUpdates.forEach((field) => {
//       if (updates.hasOwnProperty(field) && updates[field] !== undefined) {
//         invitation[field] = updates[field];
//         updatesMade = true;
//       }
//     });

//     // Special handling for status changes and timestamps
//     if (updates.hasOwnProperty("status")) {
//       const newStatus = updates.status;
//       const currentStatus = invitation.status;

//       if (!["pending", "arrived", "departed"].includes(newStatus)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid status value. Allowed: pending, arrived, departed",
//         });
//       }

//       if (newStatus !== currentStatus) {
//         updatesMade = true;

//         // Clear both timestamps when resetting to pending
//         if (newStatus === "pending") {
//           invitation.arrived_at = undefined;
//           invitation.departed_at = undefined;
//         }
//         // Set arrived timestamp when status changes to arrived
//         else if (newStatus === "arrived") {
//           invitation.arrived_at = new Date();
//           // Clear departed timestamp if coming from departed status
//           if (currentStatus === "departed") {
//             invitation.departed_at = undefined;
//           }
//         }
//         // Set departed timestamp when status changes to departed
//         else if (newStatus === "departed") {
//           if (currentStatus !== "arrived") {
//             return res.status(400).json({
//               success: false,
//               message: "Visitor must be in 'arrived' status before departing",
//             });
//           }
//           invitation.departed_at = new Date();
//         }
//       }
//     }

//     if (!updatesMade) {
//       return res.status(400).json({
//         success: false,
//         message: "No valid fields provided for update",
//         allowedFields: allowedUpdates,
//       });
//     }

//     // Save the document
//     await invitation.save();

//     // Get fresh copy of the document with all fields
//     const freshInvitation = await VisitorInvitation.findById(invitation._id);

//     // Prepare response data
//     const responseData = freshInvitation.toObject();
//     delete responseData.__v; // Remove version key

//     // Include the timestamps in response data even if they're null or undefined
//     // This makes sure they're always part of the response object structure
//     if (!responseData.hasOwnProperty("arrived_at")) {
//       responseData.arrived_at = freshInvitation.arrived_at;
//     }

//     if (!responseData.hasOwnProperty("departed_at")) {
//       responseData.departed_at = freshInvitation.departed_at;
//     }

//     res.json({
//       freshInvitation,
//       data: responseData,
//       message: "Invitation updated successfully",
//     });
//   } catch (error) {
//     console.error("Error modifying invitation:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while updating invitation",
//       error: error.message,
//     });
//   }
// };

// export const modifyGuestInvitation = async (req, res) => {
//   try {
//     const updates = req.body;
//     const invitation = await VisitorInvitation.findById(updates.invitationId);

//     if (!invitation) {
//       return res.status(404).json({
//         success: false,
//         message: "Invitation not found.",
//       });
//     }

//     // Authorization check
//     if (invitation.creator.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized to modify this invitation.",
//       });
//     }

//     const allowedUpdates = [
//       "visitor_name",
//       "gender",
//       "phone_number",
//       "expires",
//       "location",
//       "status",
//     ];

//     let updatesMade = false;

//     // Handle regular field updates
//     allowedUpdates.forEach((field) => {
//       if (updates.hasOwnProperty(field) && updates[field] !== undefined) {
//         invitation[field] = updates[field];
//         updatesMade = true;
//       }
//     });

//     // Special handling for status changes and timestamps
//     if (updates.hasOwnProperty("status")) {
//       const newStatus = updates.status;
//       const currentStatus = invitation.status;

//       if (!["pending", "arrived", "departed"].includes(newStatus)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid status value. Allowed: pending, arrived, departed",
//         });
//       }

//       if (newStatus !== currentStatus) {
//         updatesMade = true;

//         // Clear both timestamps when resetting to pending
//         if (newStatus === "pending") {
//           invitation.arrived_at = undefined;
//           invitation.departed_at = undefined;
//         }
//         // Set arrived timestamp when status changes to arrived
//         else if (newStatus === "arrived") {
//           invitation.arrived_at = new Date();
//           // Clear departed timestamp if coming from departed status
//           if (currentStatus === "departed") {
//             invitation.departed_at = undefined;
//           }
//         }
//         // Set departed timestamp when status changes to departed
//         else if (newStatus === "departed") {
//           if (currentStatus !== "arrived") {
//             return res.status(400).json({
//               success: false,
//               message: "Visitor must be in 'arrived' status before departing",
//             });
//           }
//           invitation.departed_at = new Date();
//         }
//       }
//     }

//     if (!updatesMade) {
//       return res.status(400).json({
//         success: false,
//         message: "No valid fields provided for update",
//         allowedFields: allowedUpdates,
//       });
//     }

//     // Save the document
//     await invitation.save();

//     // Get fresh copy of the document with all fields
//     const freshInvitation = await VisitorInvitation.findById(
//       invitation._id
//     ).lean(); // Using lean() to get a plain JavaScript object

//     res.json({
//       success: true,
//       data: freshInvitation, // Now contains all fields including timestamps
//       message: "Invitation updated successfully",
//     });
//   } catch (error) {
//     console.error("Error modifying invitation:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while updating invitation",
//       error: error.message,
//     });
//   }
// };

// Then update your controller function
// modifyGuestInvitation.js
export const modifyGuestInvitation = async (req, res) => {
  try {
    const updates = req.body;
    let invitation = await VisitorInvitation.findById(updates.invitationId);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found.",
      });
    }

    // Authorization check
    if (invitation.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to modify this invitation.",
      });
    }

    const allowedUpdates = [
      "visitor_name",
      "gender",
      "phone_number",
      "expires",
      "location",
      "status",
    ];

    let updatesMade = false;

    // Create update object explicitly
    const updateObj = {};

    // Handle regular field updates
    allowedUpdates.forEach((field) => {
      if (updates.hasOwnProperty(field) && updates[field] !== undefined) {
        updateObj[field] = updates[field];
        updatesMade = true;
      }
    });

    // Special handling for status changes and timestamps
    if (updates.hasOwnProperty("status")) {
      const newStatus = updates.status;
      const currentStatus = invitation.status;

      if (!["pending", "arrived", "departed"].includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value. Allowed: pending, arrived, departed",
        });
      }

      if (newStatus !== currentStatus) {
        updatesMade = true;
        updateObj.status = newStatus;

        // Clear both timestamps when resetting to pending
        if (newStatus === "pending") {
          updateObj.arrived_at = null;
          updateObj.departed_at = null;
        }
        // Set arrived timestamp when status changes to arrived
        else if (newStatus === "arrived") {
          updateObj.arrived_at = new Date();
          // Clear departed timestamp if coming from departed status
          if (currentStatus === "departed") {
            updateObj.departed_at = null;
          }
        }
        // Set departed timestamp when status changes to departed
        else if (newStatus === "departed") {
          if (currentStatus !== "arrived") {
            return res.status(400).json({
              success: false,
              message: "Visitor must be in 'arrived' status before departing",
            });
          }
          updateObj.departed_at = new Date();
        }
      }
    }

    if (!updatesMade) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
        allowedFields: allowedUpdates,
      });
    }

    // Use findByIdAndUpdate to update and return the fresh document in one operation
    const updatedInvitation = await VisitorInvitation.findByIdAndUpdate(
      invitation._id,
      updateObj,
      { new: true } // This returns the document after update was applied
    );

    res.json({
      success: true,
      data: updatedInvitation,
      message: "Invitation updated successfully",
    });
  } catch (error) {
    console.error("Error modifying invitation:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating invitation",
      error: error.message,
    });
  }
};
