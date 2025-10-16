import { createComplaint, getAllComplaint } from "../controllers/complaint.js";
import { Router } from "express";
import { isAdmin, requireSignin } from "../middlewares/auth.js";

const router = Router();

router
  .route("/")
  .get(requireSignin, getAllComplaint)
  .post(requireSignin, createComplaint);

// router.route("/user").get(requireSignin, getComplaintByUserId);
// router
//   .route("/:id")
//   .delete(requireSignin, deleteComplaint)
//   .get(requireSignin, getComplaintById)
//   .patch(
//     requireSignin,
//     checkClan_IsAproved_and_UserAnAdmin_noParams,
//     updateComplaintStatus
//   );
export default router;
