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
  check_User_is_Admins_of_clan,
  checkClan_IsAproved_and_UserAnAdmin_noParams,
  checkClanAdmin,
} from "../middlewares/clan.js";
import {
  ClanAdminDeleteDue,
  ClanAdmingetDues,
  createDue,
  fetchClanWallet,
  fetchWallet,
  fundWallet,
  getDueById,
  getUserDuesToPay,
  payDue,
  PaymentWebhook,
} from "../controllers/wallet.js";
import { Estate_Admin_getUserClans } from "../controllers/clan.js";

const router = express.Router();

router
  .route("/")
  .get(requireSignin, fetchWallet)
  .post(requireSignin, fundWallet);

router.route("/pay-due").get(requireSignin, getUserDuesToPay);
router.route("/pay-due/:dueId").get(requireSignin, payDue);
//   .post(requireSignin, payDue);

router
  .route("/clan-wallet")
  .get(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    fetchClanWallet
  );

router
  .route("/clan-due")
  .get(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    ClanAdmingetDues
  )
  .post(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,

    createDue
  );

router
  .route("/clan-due/:dueId")
  .get(requireSignin, checkClan_IsAproved_and_UserAnAdmin_noParams, getDueById)
  .delete(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    ClanAdminDeleteDue
  );
//   .delete(
//     requireSignin,
//     checkClan_IsAproved_and_UserAnAdmin_noParams,
//     ClanAdminDeleteDue
//   );

router.route("/payment-webhook").post(PaymentWebhook);

export default router;
