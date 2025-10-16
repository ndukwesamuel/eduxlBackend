// routes/EstateUser/Guest.js
import express from "express";
import { modifyGuestInvitation } from "../../controllers/EstateUser/Guest.js"; // adjust path if needed

const router = express.Router();

router.patch("/modify", modifyGuestInvitation);

export default router;
