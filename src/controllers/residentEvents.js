import asyncWrapper from "../middlewares/asyncWrapper.js";
import UserProfile from "../models/profile.js";
import ResidentEvent from "../models/residentEvent.js";
import residentEvent from "../services/residentEvent.js";

export const createResidentEvent = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  const clanId = req.clan._id;

  const userprofile = await UserProfile.findOne({ user: userId });
  if (!userprofile) {
    res.status(404).json({ message: "User not found" });
  }

  const requiredFields = [
    "name",
    "date",
    "time",
    "location",
    "guestNumber",
    // "location",
  ];
  const missingField = requiredFields.find((field) => !(field in req.body));
  if (missingField) {
    return res.status(400).json({ message: `${missingField} is required!` });
  }

  const event = await ResidentEvent.create({
    ...req.body,
    user: userId,
    clan: clanId,
  });

  res.status(200).json({ message: "Event Created", event });
});

export const createAdminResidentEvent = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  const clanId = req.clan._id;

  const userprofile = await UserProfile.findOne({ user: userId });
  if (!userprofile) {
    res.status(404).json({ message: "User not found" });
  }

  const requiredFields = ["name", "date", "time", "location", "guestNumber"];
  const missingField = requiredFields.find((field) => !(field in req.body));
  if (missingField) {
    return res.status(400).json({ message: `${missingField} is required!` });
  }

  const event = await ResidentEvent.create({
    ...req.body,
    user: userId,
    clan: clanId,
    isAdmin: true,
  });

  res.status(200).json({ message: "Event Created", event });
});

export const AdminGetResidentEvent = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  const clanId = req.clan._id;
  // const events = await residentEvent.FindEvent(userId, clanId);
  const events = await ResidentEvent.find({
    _id: id,
    clan: clanId,
  })
    .populate("user clan")
    .sort({ createdAt: -1 });
  res.status(200).json({ events });
});

export const AdminGetSingleResidentEvent = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  const clanId = req.clan._id;
  const { id } = req.params;
  // const events = await residentEvent.FindEvent(userId, clanId);
  const events = await ResidentEvent.findOne({
    _id: id,
    clan: clanId,
  }).populate("user clan");

  res.status(200).json({ events });
});

export const getResidentEvent = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  const clanId = req.clan._id;
  const events = await ResidentEvent.find({ user: userId })
    .populate("user clan")
    .sort({ createdAt: -1 });
  res.status(200).json({ events });
});

export const getSingleResidentEvent = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  const clanId = req.clan._id;
  const { id } = req.params;
  // const events = await residentEvent.FindEvent(userId, clanId);
  const events = await ResidentEvent.findOne({
    _id: id,
    clan: clanId,
  }).populate("user clan");
  res.status(200).json({ events });
});

export const getGeneralResidentEvent = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  const clanId = req.clan._id;

  const events = await ResidentEvent.find({
    clan: clanId,
    isAdmin: true,
  })
    .populate("user clan")
    .sort({ createdAt: -1 });

  res.status(200).json({ events });
});

export const CancelResidentEvent = asyncWrapper(async (req, res) => {
  const userId = req.user._id;
  const clanId = req.clan._id;
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "Event ID is required" });
  }
  console.log({
    _id: id,
    clan: clanId,
  });

  const result = await ResidentEvent.deleteOne({
    _id: id,

    clan: clanId,
  });

  if (result.deletedCount === 1) {
    res
      .status(200)
      .json({ message: `Successfully deleted event with id ${id}` });
  } else {
    res.status(404).json({ message: `No event found with id ${id}` });
  }

  // res.status(200).json({ message: "Event cancelled successfully" });
});
