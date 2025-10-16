// routes/EstateUser/Guest.js
import express from "express";
import { AdminverifyAccessCode } from "../../controllers/EstateAdmin/AdminGuest.js";
import { Approve_Suspend_Member } from "../../controllers/EstateAdmin/EstateMembers.js";
// import { verifyAccessCode } from "../../controllers/EstateAdmin/AdminGuest.js";

const router = express.Router();

router.post("/approve-suppend-member", Approve_Suspend_Member);

// router.get("/", (req, res) => {
//   res.json({ message: "Estate Member route working" });
// });

export default router;
