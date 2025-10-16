import Errand from "../../../models/errand.js";
import RunnerProfile from "../../../models/runner.js";
import User from "../../../models/user.js";

export const getAvailableErrands = async (req, res) => {
  try {
    // Basic query
    let userId = req.user._id;

    let runnerInfo = await RunnerProfile.findOne({ user: userId })
      .populate("user", "name email") // Only get name and email of user
      .populate("clan", "name"); // Only get clan name

    let runnerClan = runnerInfo.clan._id;

    let query = Errand.find({
      // clan: runnerClan,
      status: "assigned", // Add status filter for pending errands
    });

    // Optional: Add population for referenced documents
    query = query
      .populate("user", "name email") // Only get name and email of user
      .populate("clan", "name") // Only get clan name
      .populate("assignedTo", "name"); // Only get assigned user's name

    // Optional: Sorting (newest first by default)
    query = query.sort("-createdAt");

    // // Optional: Pagination
    // const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 10;
    // const skip = (page - 1) * limit;

    // query = query.skip(skip).limit(limit);

    // Execute query
    const errands = await query.exec();

    // Get total count for pagination info - make sure to include the status filter here too
    const total = await Errand.countDocuments({
      // clan: runnerClan,
      status: "assigned",
    });

    res.json({
      success: true,
      count: errands.length,
      data: errands,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

export const assignedTogetAvailableErrands = async (req, res) => {
  try {
    // Basic query
    let userId = req.user._id;

    let runnerInfo = await RunnerProfile.findOne({ user: userId })
      .populate("user", "name email")
      .populate("clan", "name");

    // Check if runner profile exists
    if (!runnerInfo) {
      return res.status(404).json({
        success: false,
        message: "Runner profile not found",
      });
    }

    // Check if runner has a clan assigned
    if (!runnerInfo.clan) {
      return res.status(400).json({
        success: false,
        message: "Runner is not assigned to any clan",
      });
    }

    let runnerClan = runnerInfo.clan._id;

    let query = Errand.find({
      // clan: runnerClan,
      // assignedTo: userId,
      status: { $ne: "completed" }, // Optional: filter out completed errands
    });

    // Optional: Add population for referenced documents
    query = query
      .populate("user", "name email")
      .populate("clan", "name")
      .populate("assignedTo", "name");

    // Optional: Sorting (newest first by default)
    query = query.sort("-createdAt");

    // Optional: Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    // Execute query
    const errands = await query.exec();

    // Get total count for pagination info - include the same filters
    const total = await Errand.countDocuments({
      clan: runnerClan,
      assignedTo: userId,
      status: { $ne: "completed" },
    });

    res.json({
      success: true,
      count: errands.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: errands,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

export const acceptErrand = async (req, res) => {
  try {
    const { errandId } = req.params;
    const userId = req.user._id;

    const errand = await Errand.findOne({
      _id: errandId,
      status: "pending",
      runner: null,
    });

    if (!errand) {
      return res.status(400).json({
        success: false,
        message: "Errand not available or already taken",
      });
    }

    errand.runner = userId;
    errand.status = "accepted";
    errand.acceptedAt = new Date();

    await errand.save();

    const populatedErrand = await Errand.findById(errandId).populate(
      "resident clan",
      "name email"
    );

    res.json({
      success: true,
      message: "Errand accepted successfully",
      data: populatedErrand,
    });
  } catch (error) {
    console.error("Error accepting errand:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept errand",
    });
  }
};

export const updateErrandStatus = async (req, res) => {
  try {
    const { status, errandId } = req.body;
    const userId = req.user._id;

    // Only these status transitions are allowed
    const allowedStatuses = ["en_route", "picked_up", "delivered"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status update. Only allowed: en_route, picked_up, delivered",
      });
    }

    const errand = await Errand.findOne({ _id: errandId });
    if (!errand) {
      return res.status(404).json({
        success: false,
        message: "Errand not found",
      });
    }

    // Strict one-way transition mapping
    const validNextStatus = {
      assigned: "en_route",
      en_route: "picked_up",
      picked_up: "delivered",
    };

    // Check if this is a valid progression
    if (status !== validNextStatus[errand.status]) {
      return res.status(400).json({
        success: false,
        message: `Invalid status progression. Current: ${
          errand.status
        }, can only change to: ${validNextStatus[errand.status] || "nothing"}`,
        currentStatus: errand.status,
        allowedNextStatus: validNextStatus[errand.status],
      });
    }

    // Special handling for assigned -> en_route transition
    if (errand.status === "assigned" && status === "en_route") {
      // Update the assignedTo to the current user
      errand.assignedTo = userId;
    }
    // For all other transitions, verify the user is the assigned courier
    else if (errand.assignedTo?.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned courier can update the errand status",
      });
    }

    // Update status and timestamps
    errand.status = status;

    if (status === "picked_up") {
      errand.pickedUpAt = new Date();
    } else if (status === "delivered") {
      errand.deliveredAt = new Date();
    }

    await errand.save();

    res.json({
      success: true,
      message: `Errand progressed from ${errand.status} to ${status}`,
      data: errand,
    });
  } catch (error) {
    console.error("Error updating errand status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update errand status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
export const getMyErrands = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { runner: userId };
    if (status) {
      query.status = status;
    }

    const [totalErrands, errands] = await Promise.all([
      Errand.countDocuments(query),
      Errand.find(query)
        .populate("resident clan", "name email")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.json({
      success: true,
      data: {
        errands,
        count: errands.length,
        total: totalErrands,
        page,
        totalPages: Math.ceil(totalErrands / limit),
      },
    });
  } catch (error) {
    console.error("Error getting runner errands:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get your errands",
    });
  }
};

// this is for guest

export const GetAllGuestErrands = async (req, res) => {
  try {
    const userId = req.user._id;
    // const { status } = req.query;

    // const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 10;
    // const skip = (page - 1) * limit;

    // const query = { runner: userId };
    // if (status) {
    //   query.status = status;
    // }

    // const [totalErrands, errands] = await Promise.all([
    //   Errand.countDocuments(query),
    //   Errand.find(query)
    //     .populate("resident clan", "name email")
    //     .sort({ updatedAt: -1 })
    //     .skip(skip)
    //     .limit(limit),
    // ]);

    res.json({
      success: true,
      userId,
      // data: {
      //   errands,
      //   count: errands.length,
      //   total: totalErrands,
      //   page,
      //   totalPages: Math.ceil(totalErrands / limit),
      // },
    });
  } catch (error) {
    console.error("Error getting runner errands:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get your errands",
    });
  }
};

// v2

export const generalgetAvailableErrands = async (req, res) => {
  try {
    // Basic query
    let userId = req.user._id;

    let runnerInfo = await RunnerProfile.findOne({ user: userId })
      .populate("user", "name email") // Only get name and email of user
      .populate("clan", "name"); // Only get clan name

    let runnerClan = runnerInfo.clan._id;

    let query = Errand.find({
      // clan: runnerClan,
      status: "assigned", // Add status filter for pending errands
    });

    // Optional: Add population for referenced documents
    query = query
      .populate("user", "name email") // Only get name and email of user
      .populate("clan", "name") // Only get clan name
      .populate("assignedTo", "name"); // Only get assigned user's name

    // Optional: Sorting (newest first by default)
    query = query.sort("-createdAt");

    // // Optional: Pagination
    // const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 10;
    // const skip = (page - 1) * limit;

    // query = query.skip(skip).limit(limit);

    // Execute query
    const errands = await query.exec();

    // Get total count for pagination info - make sure to include the status filter here too
    const total = await Errand.countDocuments({
      // clan: runnerClan,
      status: "assigned",
    });

    res.json({
      success: true,
      count: errands.length,
      data: errands,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
