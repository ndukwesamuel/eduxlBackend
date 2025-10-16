import express from "express";
// import { requireSignin, isAdmin } from "../middlewares/auth.js";
import {
  esatetAdminlogin,
  getAllEstatesForAdmin,
} from "../controllers/auth.js";
import { validateLogin } from "../utils/validator.js";
import { estateAdmin, requireSignin } from "../../middlewares/auth.js";
import {
  addMemberToHousehold,
  assignMemberCode,
  ClanmakeMemberAdmin,
  createDue,
  createHousehold,
  createRate,
  deleteHousehold,
  editMember,
  getAllHouseholds,
  getAllMembers,
  getAllmemeberNotInAnHousehold,
  getClanMemberProfiles,
  getSingleHouseholds,
  registerBulkUsersForEstate,
  removeMemberFromHousehold,
  update_withdrawal_account_details,
  WebClanAdmingetDues,
  WebcreateServiceVendorAccount,
  WebfetchClanWallet,
  withdrawal_account_history,
  withdrawal_money,
} from "../controllers/EstateAdmin/clan.js";
import { createServiceVendorAccount } from "../../controllers/serviceVendor.js";
// import { makeMemberAdmin } from "../controllers/SuperAdmin/clan.js";
import AdminGuestRoute from "./EstateAdmin/AdminGuestRoute.js";
import WebAdminGuestRoute from "./EstateAdmin/WebAdminGuestRoute.js";
import EstateMembersRoute from "./EstateAdmin/EstateMembersRoute.js";
import { checkClan_IsAproved_and_UserAnAdmin_noParams } from "../../middlewares/clan.js";

const router = express.Router();

router.use(
  "/adminGuest",
  requireSignin,
  checkClan_IsAproved_and_UserAnAdmin_noParams,
  AdminGuestRoute
);

router.use(
  "/:clanId/webAdminGuest",
  requireSignin,
  estateAdmin,
  WebAdminGuestRoute
);

router.use(
  "/:clanId/webEstateMember",
  requireSignin,
  estateAdmin,
  EstateMembersRoute
);

router.post(
  "/add-member",
  requireSignin,

  addMemberToHousehold
);
router.post("/createDue", requireSignin, estateAdmin, createDue);
router.post(
  "/createuser",
  requireSignin,
  estateAdmin,
  registerBulkUsersForEstate
);
router.post("/membercode", requireSignin, estateAdmin, assignMemberCode);
router.post("/withdrawal-money", requireSignin, withdrawal_money);
router.post(
  "/updateaccount",
  requireSignin,
  estateAdmin,
  update_withdrawal_account_details
);
router.post("/create_household", requireSignin, estateAdmin, createHousehold);
router.post(
  "/makeMemberAdmin",
  requireSignin,
  estateAdmin,
  ClanmakeMemberAdmin
);

router.get(
  "/all-household/:clanId",
  requireSignin,
  estateAdmin,
  getAllHouseholds
);
router.get(
  "/single-household/:clanId/:id",
  requireSignin,
  estateAdmin,
  getSingleHouseholds
);
router.get("/wallet/:clanId", requireSignin, estateAdmin, WebfetchClanWallet);
router.get(
  "/getallDue/:clanId",
  requireSignin,
  estateAdmin,
  WebClanAdmingetDues
);
router.get(
  "/withdrawal-account-history/:clanId",
  requireSignin,
  estateAdmin,
  withdrawal_account_history
);

router.delete(
  "/remove-member/:householdId/:userId",
  requireSignin,
  // estateAdmin,
  removeMemberFromHousehold
);
router.delete(
  "/remove-houseHold/:householdId",
  requireSignin,
  // estateAdmin,
  deleteHousehold
);

router.get(
  "/get-all-member-not-in-an-household/:clanId",
  requireSignin,
  estateAdmin,
  getAllmemeberNotInAnHousehold
);

router.post(
  "/Servicecreate/:clanId",
  requireSignin,
  estateAdmin,
  WebcreateServiceVendorAccount
);

router.get("/:clanId", requireSignin, estateAdmin, getAllMembers);
router.patch("/:clanId", requireSignin, estateAdmin, editMember);
router.get(
  "/:clanId/:userId",
  requireSignin,
  estateAdmin,
  getClanMemberProfiles
);
// router.get("/wallet/:clanId", WebfetchClanWallet);

export default router;
