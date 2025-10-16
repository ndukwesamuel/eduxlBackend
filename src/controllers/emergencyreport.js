// clanController.js
import Clan from "../models/clan.js";
import UserProfile from "../models/profile.js";

import User from "../models/user.js";

import EmergencyReport from "../models/clanemergencyreport.js";
import { sendNotificationsMutiple } from "../services/exponotificationService.js";
import { EmergencyService } from "../services/emagencyservice.js";

export const CreateEmergencyReport = async (req, res) => {
  try {
    const clan_info = req.clan;
    const userId = req.user._id;
    const clanId = clan_info._id;
    // const { clanId, memberId } = req.params;

    const { type, address, additionalInfo } = req.body;

    if (!type || !address) {
      return res
        .status(400)
        .json({ error: "Type and address are required fields." });
    }

    const emergencyReport = new EmergencyReport({
      clan: clanId,
      member: userId,
      type,
      address,
      additionalInfo,
    });

    // Save the report to the database
    await emergencyReport.save();

    const EmergencyService_response = await EmergencyService(
      clan_info,
      emergencyReport
    );

    return res.status(201).json({
      message: "Emergency report created successfully.",
      data: EmergencyService_response,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

export const ClanAdmin_Get_All_EmergencyReport = async (req, res) => {
  try {
    let clan_info = req.clan;
    const userId = req.user._id;

    const reports = await EmergencyReport.find({
      clan: clan_info._id,
    })
      .populate("member")
      .sort({ createdAt: -1 });

    if (!reports) {
      return res
        .status(200)
        .json({ reports: [], message: "No reports found." });
    }

    res.status(200).json({ reports });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

export const ClanAdmin_Get_Single_EmergencyReport = async (req, res) => {
  try {
    const { emergencyReportId } = req.params;
    let clan_info = req.clan;
    const userId = req.user._id;

    const report = await EmergencyReport.findOne({
      _id: emergencyReportId,
      clan: clan_info._id,
    })
      .populate("clan", "name") // Populate the "clan" field with the name property only
      .populate("member", "name"); // Populate the "member" field with the username property only

    const userProfile = await UserProfile.findOne({ user: report.member._id });

    res.status(200).json({ report, userProfile });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

export const ClanAdmin_resolve_EmergencyReport = async (req, res) => {
  try {
    const { emergencyReportId } = req.params;

    const { status } = req.body;

    const emergencyReport = await EmergencyReport.findById(emergencyReportId);

    if (!emergencyReport) {
      return res.status(404).json({ message: "Emergency report not found" });
    }

    // Check if the report is already resolved
    if (emergencyReport.status === "resolved") {
      return res
        .status(400)
        .json({ message: "Emergency report is already resolved" });
    }

    // Update the status to resolved
    emergencyReport.status = "resolved";
    await emergencyReport.save();

    // Send a success response
    res.status(200).json({
      message: "Emergency report resolved successfully.",
      emergencyReport,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

export const getMemberEmergencyReports = async (req, res) => {
  try {
    const clan_info = req.clan;
    const userId = req.user._id;
    const clanId = clan_info._id;

    const reports = await EmergencyReport.find({ member: userId })
      .populate("clan", "name") // Only include clan name
      .populate("member", "firstName lastName") // Include member's name
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json(reports);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};
