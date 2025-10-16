import jwt from "jsonwebtoken";
import User from "../models/user.js";
import clan from "../models/clan.js";

export const requireSignin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // console.log(authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res
      .status(401)
      .json({ error: true, message: "Authentication invalid" });
  }
  const token = authHeader.split(" ")[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        console.log({
          dd: err,
        });
        res.status(403).json({ error: true, message: "Invalid token", token });
      } else {
        req.user = decodedToken;
        console.log({ decodedToken });
        next();
      }
    });
  } else {
    res.status(401).json({ error: true, message: "You are not authenticated" });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate();
    // console.log(user);

    if (!user) {
      return res.status(401).send("User not found");
    }

    if (!user.roles.includes("admin")) {
      return res.status(403).json({ error: "Unauthorized user" });
    }

    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const isSuperadmin = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate();

    if (!user) {
      return res.status(401).send("User not found");
    }

    console.log({
      cc: user,
    });

    if (!user.roles.includes("superadmin")) {
      return res.status(403).json({ error: "Unauthorized user" });
    }

    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const estateAdmin = async (req, res, next) => {
  try {
    const clanId = req.params.clanId || req.body.clanId;
    if (!clanId) {
      return res.status(400).json({
        success: false,
        message: "clanId is required in either params or body",
      });
    }

    const claninfo = await clan
      .findById(clanId)
      .populate("members.user", "name email")
      .populate("admins.user", "name email");

    if (!clan) {
      return res.status(404).json({ error: "Clan not found" });
    }

    const userId = req.user._id;
    const user = await User.findById(userId).populate();

    if (!user) {
      return res.status(401).send("User not found");
    }

    // 4. Check if user is a clan admin with level 1 or 2
    const adminRecord = claninfo.admins.find(
      (admin) => admin.user._id.toString() === userId.toString()
    );

    if (!adminRecord) {
      return res.status(403).json({
        success: false,
        message: "Access denied - Not a clan admin",
      });
    }

    if (adminRecord.level > 2) {
      return res.status(403).json({
        success: false,
        message: "Access denied - Requires admin level 1 or 2",
      });
    }

    req.claninfo = claninfo;

    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const pushNotification = async () => {};
