import Complaint from "../models/complaint.js";

const createComplaint = async (req, res) => {
  const userId = req.user._id;
  // User clan id

  const { complaint } = req.body;

  try {
    if (!complaint) {
      return res.status(400).json({ message: "Field is empty" });
    }
    const newComplaint = new Complaint({
      user: userId,
      complaint,
    });

    // Save the complaint to the database
    const savedComplaint = await newComplaint.save();
    res.status(200).json({
      message: "Complaints created successfully",
      data: savedComplaint,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message, message: "Internal server error" });
  }
};

// const updateComplaintStatus = async (req, res) => {
//   const complaintId = req.params.id;
//   const { status } = req.body;
//   try {
//     if (status !== "processing" && status !== "completed") {
//       return res.status(400).json({
//         message: "Invalid status: Use 'processing' or 'completed'",
//       });
//     }
//     const data = {
//       status: status,
//     };
//     const complaint = await Complaint.findByIdAndUpdate(
//       { _id: complaintId },
//       data,
//       {
//         new: true,
//       }
//     );
//     if (!complaint) {
//       return res.status(404).json({ message: "Not found", data: complaint });
//     }
//     await complaint.save();
//     res
//       .status(200)
//       .json({ message: "Status updated successfully", data: complaint });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: error.message, message: "Internal server error" });
//   }
// };
// const getComplaintByUserId = async (req, res) => {
//   const userId = req.user;
//   if (!userId) {
//     return res.json({ message: "You need to be logged in" });
//   }
//   try {
//     const complaint = await Complaint.find({ user: userId }).sort({
//       createdAt: -1,
//     });
//     if (!complaint) {
//       return res
//         .status(200)
//         .json({ message: "No complaint yet", data: complaint });
//     }
//     res.status(200).json({ data: complaint });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: error.message, message: "Internal server error" });
//   }
// };
// This will give all the complaints in the particular clan the admin belongs

const getAllComplaint = async (req, res) => {
  try {
    // Fetch all complaints from the database
    const complaints = await Complaint.find().sort({ createdAt: -1 }); // Sort by createdAt field in descending order

    // Respond with the fetched complaints
    res.status(200).json({ data: complaints });
  } catch (error) {
    // Handle errors
    console.error("Error fetching complaints:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
// const getAllComplaint = async (req, res) => {
//   const clanId = req.clan.id;
//   try {
//     const complaint = await Complaint.find({ clan: clanId })
//       .populate("user", ["name", "email"])
//       .sort({
//         createdAt: -1,
//       });
//     if (!complaint) {
//       return res
//         .status(200)
//         .json({ message: "No complaint yet", data: complaint });
//     }
//     res.status(200).json({ data: complaint });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: error.message, message: "Internal server error" });
//   }
// };
// const getComplaintById = async (req, res) => {
//   const complaintId = req.params.id;
//   try {
//     const complaint = await Complaint.findOne({ _id: complaintId })
//       .populate("user", ["name", "email"])
//       .sort({
//         createdAt: -1,
//       });
//     if (!complaint) {
//       return res.status(404).json({ message: "Not found", data: complaint });
//     }
//     res.status(200).json({ data: complaint });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: error.message, message: "Internal server error" });
//   }
// };
// const deleteComplaint = async (req, res) => {
//   const complaintId = req.params.id;
//   try {
//     const complaint = await Complaint.findByIdAndDelete(complaintId);
//     if (!complaint) {
//       return res.status(404).json({ message: "Not found", data: complaint });
//     }
//     res.status(200).json({ message: "Complaint deleted successfully" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: error.message, message: "Internal server error" });
//   }
// };
export {
  createComplaint,
  // updateComplaintStatus,
  // getComplaintByUserId,
  // deleteComplaint,
  getAllComplaint,
  // getComplaintById,
};
