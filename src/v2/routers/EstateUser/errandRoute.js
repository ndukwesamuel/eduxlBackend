import express from "express";
import {
  createErrand,
  getMyErrands,
  getErrandById,
  cancelErrand,
  updateErrand,
  completed_canlcel_ErrandStatus,
  PickupErrands,
} from "../../controllers/EstateUser/errand.js";
import { requireSignin } from "../../../middlewares/auth.js";
import { checkClan_IsAproved_and_MemberAproved_noParams } from "../../../middlewares/clan.js";
const router = express.Router();

router.post("/", createErrand).get("/", getMyErrands);
router.patch("/", updateErrand);
router.patch("/complete_cancel", completed_canlcel_ErrandStatus);
// router.post("/pickUp", PickupErrands);

// .post("/", cancelErrand);
// router.patch("/", updateErrand);

// router.get("/me", requireSignin, getMyErrands);
router.get("/:errandId", requireSignin, getErrandById);
router.patch("/:errandId/cancel", requireSignin, cancelErrand);

export default router;
