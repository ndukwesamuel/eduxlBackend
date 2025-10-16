// routes/EstateUser/Guest.js
import express from "express";
import { AdminverifyAccessCode } from "../../controllers/EstateAdmin/AdminGuest.js";
// import { verifyAccessCode } from "../../controllers/EstateAdmin/AdminGuest.js";

const router = express.Router();

router.patch("/verify-code", AdminverifyAccessCode);

export default router;
