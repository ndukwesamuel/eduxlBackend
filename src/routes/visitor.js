import express from "express";
import {
  generateAccessCode,
  cancelInvitation,
  modifyInvitation,
  verifyAccessCode,
  getAllClanInvites,
  getAllUserInvites,
  getInvitationById,
} from "../controllers/visitor.js";
import { requireSignin } from "../middlewares/auth.js";
import {
  checkClan_IsAproved_and_MemberAproved_noParams,
  checkClanAdmin,
} from "../middlewares/clan.js";

const router = express.Router();

router.post(
  "/generate-access-code/:clanId",
  requireSignin,
  checkClan_IsAproved_and_MemberAproved_noParams,
  generateAccessCode
);
router.post("/cancel/:invitationId", requireSignin, cancelInvitation);
router.patch("/modify/:invitationId", requireSignin, modifyInvitation);
router.post("/verify/:clanId", requireSignin, checkClanAdmin, verifyAccessCode);
router.get(
  "/invites/:clanId",
  requireSignin,
  checkClanAdmin,
  getAllClanInvites
);
router.get("/invites", requireSignin, getAllUserInvites);
router.get("/:invitationId", requireSignin, getInvitationById);

export default router;
