import express from "express";
import {
  getAvailableErrands,
  updateErrandStatus,
  acceptErrand,
  getMyErrands,
  assignedTogetAvailableErrands,
  GetAllGuestErrands,
} from "../../controllers/EstateRunner/errandRunner.js";
import { requireSignin } from "../../../middlewares/auth.js";
import { GetAllErand } from "../../controllers/GuestUser/errand.js";
const router = express.Router();

router
  .route("/errands")
  .get(requireSignin, getAvailableErrands)
  .patch(requireSignin, updateErrandStatus);

router.get("/me", requireSignin, assignedTogetAvailableErrands);
router.get("/guest", requireSignin, GetAllErand);

router.patch("/:errandId/accept", requireSignin, acceptErrand);

export default router;
