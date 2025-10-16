import express from "express";
import {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
} from "../controllers/profile.js";
import upload from "../helpers/multer.js";
import { requireSignin, isAdmin } from "../middlewares/auth.js";

const router = express.Router();

router
  .route(["/", ""])
  .get(requireSignin, getProfile)
  .post(requireSignin, createProfile);
router.put("/update", requireSignin, updateProfile);
router.delete("/:_id", requireSignin, isAdmin, deleteProfile);

export default router;
