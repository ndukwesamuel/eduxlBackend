import express from "express";
// import { requireSignin, isAdmin } from "../middlewares/auth.js";
import {
  esatetAdminlogin,
  getAllEstatesForAdmin,
  HappyLandUpdate,
  Register,
} from "../controllers/auth.js";
import { validateLogin } from "../utils/validator.js";
import { requireSignin } from "../../middlewares/auth.js";
import {
  createAndAssignErrand,
  fundWallet,
  PickupErrands,
} from "../controllers/GeneralUser/errand.js";
import {
  GetUserProfile,
  updateProfileImage,
  UpdateUserProfile,
} from "../controllers/GeneralUser/User.js";

const router = express.Router();

router.post("/shoping", requireSignin, createAndAssignErrand);
router.post("/pickUp", requireSignin, PickupErrands);

router
  .route("/UserProfile")
  .get(requireSignin, GetUserProfile)
  .patch(requireSignin, UpdateUserProfile);

router.put("/update-profile-image", requireSignin, updateProfileImage);
export default router;
