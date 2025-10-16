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
  checkClan_IsAproved_and_UserAnAdmin_noParams,
  checkClanAdmin,
} from "../middlewares/clan.js";
import {
  AdmingetAllDomesticStaff,
  createDomesticstaff,
  deleteDomesticStaff,
  DomesticstaffDetails,
  getAllDomesticStaff,
  UpdateDomesticstaff,
} from "../controllers/domestic.js";
import { methodNotAllowed } from "../utils/customError.js";

// ../utils/methodNotAllowed");

const router = express.Router();

router
  .route("/")
  .post(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    createDomesticstaff
  )
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    getAllDomesticStaff
  )
  .all(methodNotAllowed);

router
  .route("/admin")
  .get(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    AdmingetAllDomesticStaff
  )
  .all(methodNotAllowed);

router
  .route("/:staffId")

  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    DomesticstaffDetails
  )
  .patch(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    UpdateDomesticstaff
  )
  .delete(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    deleteDomesticStaff
  )
  .all(methodNotAllowed);

export default router;
