import asyncWrapper from "../middlewares/asyncWrapper.js";
import DomesticStaff from "../models/domesticstaff.js";

export const createDomesticstaff = async (req, res) => {
  try {
    const user_id = req.user._id;
    const clan = req.clan;

    const {
      staffName,
      gender,
      phone,
      dateOfBirth,
      homeAddress,
      Role,
      workingHours,
    } = req.body;

    const newStaff = new DomesticStaff({
      user: user_id,
      clan: clan._id,
      staffName,
      gender,
      phone,
      dateOfBirth,
      homeAddress,
      Role,
      workingHours,
    });

    const savedStaff = await newStaff.save();
    res.status(201).json({ success: true, savedStaff });
  } catch (error) {
    console.error("Error generating access code:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const UpdateDomesticstaff = asyncWrapper(async (req, res) => {
  const { staffId } = req.params;
  const {
    staffName,
    gender,
    phone,
    dateOfBirth,
    homeAddress,
    Role,
    workingHours,
  } = req.body;
  const staff = await DomesticStaff.findOne({
    _id: staffId,
    user: req.user._id,
    clan: req.clan._id,
  });
  if (!staff) {
    return res
      .status(404)
      .json({ success: false, message: "Staff not found." });
  }
  staff.staffName = staffName;
  staff.gender = gender;
  staff.phone = phone;
  staff.dateOfBirth = dateOfBirth;
  staff.homeAddress = homeAddress;
  staff.Role = Role;
  staff.workingHours = workingHours;
  await staff.save();
  res.json({ success: true, staff });
});

export const DomesticstaffDetails = asyncWrapper(async (req, res) => {
  const { staffId } = req.params;

  const staff = await DomesticStaff.findOne({
    _id: staffId,
    user: req.user._id,
    clan: req.clan._id,
  });
  if (!staff) {
    return res
      .status(404)
      .json({ success: false, message: "Staff not found." });
  }

  res.json({ success: true, staff });
});

export const getAllDomesticStaff = asyncWrapper(async (req, res) => {
  const domesticStaff = await DomesticStaff.find({
    user: req.user._id,
    clan: req.clan._id,
  }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, domesticStaff });
});

export const AdminDomesticstaffDetails = asyncWrapper(async (req, res) => {
  //   const { staffId } = req.params;

  //   const staff = await DomesticStaff.findOne({
  //     _id: staffId,
  //     user: req.user._id,
  //     clan: req.clan._id,
  //   });
  //   if (!staff) {
  //     return res
  //       .status(404)
  //       .json({ success: false, message: "Staff not found." });
  //   }

  res.json({ success: true, staff: "skjdsdkj" });
});

export const AdmingetAllDomesticStaff = asyncWrapper(async (req, res) => {
  const clan = req.clan._id;
  const domesticStaff = await DomesticStaff.find({
    clan: req.clan._id,
  }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: domesticStaff });
});

export const deleteDomesticStaff = async (req, res) => {
  try {
    const { staffId } = req.params;
    const deletedEvent = await DomesticStaff.findByIdAndDelete(staffId);
    res.json({
      message: `Staff deleted successfully`,
      deletedEvent,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to delete event", errorMsg: error.message });
  }
};
