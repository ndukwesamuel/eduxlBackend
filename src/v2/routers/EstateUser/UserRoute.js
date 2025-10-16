// routes/EstateUser/Guest.js
import express from "express";
import { modifyGuestInvitation } from "../../controllers/EstateUser/Guest.js"; // adjust path if needed
import {
  BulkTestPushwithMail,
  login,
  PushNotification,
  SendNotificationToDev,
  TestPushwithMail,
  updateProfileInfo,
} from "../../controllers/EstateUser/User.js";
import { requireSignin } from "../../../middlewares/auth.js";
import { checkClan_IsAproved_and_MemberAproved_noParams } from "../../../middlewares/clan.js";

const router = express.Router();

router.post("/push", PushNotification);
router.post("/login", login);
router.post("/test-push-mail", TestPushwithMail);
router.post("/Bulktest-push-mail", BulkTestPushwithMail);
router.get("/push-mail", SendNotificationToDev);
router.patch(
  "/update-profile",
  requireSignin,
  checkClan_IsAproved_and_MemberAproved_noParams,
  updateProfileInfo
);

export default router;
