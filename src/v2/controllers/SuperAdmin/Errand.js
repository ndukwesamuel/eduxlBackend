import mongoose from "mongoose";
import errand from "../../../models/errand.js";
import clan from "../../../models/clan.js";
import user from "../../../models/user.js";
import { hashPassword } from "../../../helpers/auth.js";
import RunnerProfile from "../../../models/runner.js";

export const GetErrands = async (req, res) => {
  const session = await mongoose.startSession(); // Start a new session
  session.startTransaction(); // Start a transaction

  try {
    const errands = await errand
      .find()
      .populate("user", "name email") // Populate 'user' field, selecting only 'name' and 'email'
      .populate("clan")
      .populate("assignedTo");

    res.status(200).json({
      success: true,
      count: errands.length,
      errands,
    });
  } catch (error) {
    // Abort the transaction in case of any error
    await session.abortTransaction();
    session.endSession();

    console.error("Error in registerAndCreateClan:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const AdminaddRunner = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, clanEmail } = req.body;
    if (!name || !email || !clanEmail) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }
    const existingUser = await user
      .findOne({
        email: email.toLowerCase(),
      })
      .session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const clan_data = await clan.findOne({ email: clanEmail });
    if (!clan_data) {
      return res.status(404).json({
        success: false,
        message: "Clan with this email not found",
      });
    }
    const defaultPassword = "123456789";
    const hashedPassword = await hashPassword(defaultPassword);

    const newUser = new user({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      roles: ["runner"],
      isVerified: true,
      isActive: true,
    });
    const savedUser = await newUser.save({ session });
    const userProfile = new RunnerProfile({
      user: savedUser._id,
      clansData: [
        {
          clan: clan_data._id,
          status: "active",
        },
      ],
    });
    await userProfile.save({ session });
    await session.commitTransaction();
    session.endSession();
    return res.status(201).json({
      success: true,
      message: "Runner added successfully to estate",
      data: {
        defaultPassword: defaultPassword,
        loginInstructions: "Runner should change password after first login",
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error adding runner:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while adding runner",
    });
  }
};

export const AdminUpdateRunner = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { runnerID, clanEmail } = req.body;

  try {
    if (!runnerID || !clanEmail) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: " emails are required",
      });
    }

    const runner = await RunnerProfile.findById(runnerID).session(session);
    if (!runner) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Runner profile not found",
      });
    }

    // Find clan by email
    const clan_data = await clan.findOne({ email: clanEmail }).session(session);
    if (!clan_data) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Clan not found",
      });
    }

    const alreadyInClan = runner.clansData.some(
      (c) => c.clan.toString() === clan_data._id.toString()
    );

    if (alreadyInClan) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Runner already belongs to this clan",
      });
    }

    runner.clansData.push({
      clan: clan_data._id,
      status: "active", // or "pending" based on your requirements
      joinedAt: new Date(),
    });

    await runner.save({ session });
    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: "Runner added successfully to estate",
      data: {
        runnerId: runner,
        clanId: clan_data._id,
        clanName: clan_data.name,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error adding runner:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while adding runner",
    });
  }
};

export const GetAllRunner = async (req, res) => {
  const session = await mongoose.startSession(); // Start a new session
  session.startTransaction(); // Start a transaction

  try {
    const errands = await RunnerProfile.find()
      .populate("user", "name email") // Populate 'user' field, selecting only 'name' and 'email'
      .populate("clansData.clan");
    res.status(200).json({
      success: true,
      count: errands.length,
      errands,
    });
  } catch (error) {
    // Abort the transaction in case of any error
    await session.abortTransaction();
    session.endSession();

    console.error("Error in registerAndCreateClan:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
