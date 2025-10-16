import express from "express";

import { isAdmin, requireSignin } from "../middlewares/auth.js";
import {
  checkClanAdmin,
  checkClan_IsApproved_and_MemberApproved_Admin,
  checkClan_IsAproved_and_MemberAproved,
  checkClan_IsAproved_and_MemberAproved_noParams,
  checkClan_IsAproved_and_UserAnAdmin_noParams,
  check_User_is_Admins_of_clan,
} from "../middlewares/clan.js";

import Clan from "../models/clan.js";
import {
  ClanAdmin_Get_All_EmergencyReport,
  ClanAdmin_Get_Single_EmergencyReport,
  ClanAdmin_resolve_EmergencyReport,
  CreateEmergencyReport,
  getMemberEmergencyReports,
} from "../controllers/emergencyreport.js";

const router = express.Router();

router
  .route("/")
  .get(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    ClanAdmin_Get_All_EmergencyReport
  )
  .post(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    CreateEmergencyReport
  ); //ok

router
  .route("/members-emergency")
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    getMemberEmergencyReports
  );

router
  .route("/resolve-emergency/:emergencyReportId")
  .get(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    ClanAdmin_resolve_EmergencyReport
  );

router
  .route("/:emergencyReportId")
  .get(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    ClanAdmin_Get_Single_EmergencyReport
  );

export default router;
