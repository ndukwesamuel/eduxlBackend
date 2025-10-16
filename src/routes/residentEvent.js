import express from "express";
import { requireSignin } from "../middlewares/auth.js";
import {
  AdminGetSingleResidentEvent,
  CancelResidentEvent,
  createAdminResidentEvent,
  createResidentEvent,
  getGeneralResidentEvent,
  getResidentEvent,
  getSingleResidentEvent,
} from "../controllers/residentEvents.js";
import {
  checkClan_IsAproved_and_MemberAproved_noParams,
  checkClan_IsAproved_and_UserAnAdmin_noParams,
} from "../middlewares/clan.js";

const router = express.Router();

router
  .route("/")
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    getResidentEvent
  )
  .post(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    createResidentEvent
  );

router
  .route("/generalevent")
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    getGeneralResidentEvent
  );

router
  .route("/admin")
  .get(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    getResidentEvent
  )
  .post(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    createAdminResidentEvent
  );

router
  .route("/:id")
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    getSingleResidentEvent
  )
  .delete(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    CancelResidentEvent
  );

router
  .route("/admin/:id")
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    AdminGetSingleResidentEvent
  )
  .post(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    createAdminResidentEvent
  );

export default router;
