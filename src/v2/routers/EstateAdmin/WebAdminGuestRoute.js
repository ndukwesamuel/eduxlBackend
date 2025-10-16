// routes/EstateUser/Guest.js
import express from "express";
import {
  AdminverifyAccessCode,
  estateGuestHistory,
} from "../../controllers/EstateAdmin/AdminGuest.js";
// import { verifyAccessCode } from "../../controllers/EstateAdmin/AdminGuest.js";

const router = express.Router();

router.get("/all_Guest", estateGuestHistory);

export default router;
