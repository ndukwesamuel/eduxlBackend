import express from "express";
import {
  createClan,
  deleteClan,
  getAllClans,
  getClanById,
  leaveClan,
  updateClan,
  confirmClan_Suspend_Approve_reject,
  requestToJoinClan,
  EstateAdminsApproveMembership,
  read,
  getUserClans,
  Select_clan,
  Leave_Select_clan,
  Estate_Admin_getUserClans,
  Admin_Select__clan,
  Admin_Leave_Select_clan,
  getAllMembers,
  getSingleMembers,
  getMembersProfile,
  UsergetAllMembers,
  registerAndCreateClan,
  fakegetClan,
  makeMemberAdmin,
  updateMembersWithUniqueIDs,
  createUsersAndAddToClan,
  approveAllMembersInClan,
  deleteMembersWithMailDomain,
  getAllClanMembers,
} from "../controllers/clan.js";
import { isAdmin, requireSignin } from "../middlewares/auth.js";
import {
  checkClan_IsApproved_and_MemberApproved_Admin,
  checkClan_IsAproved_and_MemberAproved,
  checkClan_IsAproved_and_MemberAproved_noParams,
  checkClan_IsAproved_and_UserAnAdmin_noParams,
  check_User_is_Admins_of_clan,
} from "../middlewares/clan.js";
import { CreateWalletsForAllUsers } from "../controllers/wallet.js";
// import { createWalletsForAllClans } from "../controllers/wallet.js";

const router = express.Router();

router.route("/").get(requireSignin, getAllClans);
router.route("/test_test").get(fakegetClan);
// router.route("/test_tests").get(makeMemberAdmin);
router.route("/test_test2").get(updateMembersWithUniqueIDs);
router.route("/test_test3").get(createUsersAndAddToClan);
router.route("/test_test4").get(approveAllMembersInClan);
router.route("/test_test5").get(deleteMembersWithMailDomain);
router.route("/test_test6").get(getAllClanMembers);
// router.route("/test_test7").get(createWalletsForAllClans);

router.route("/test_test7").get(CreateWalletsForAllUsers);

router
  .route("/usergetMember")
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    UsergetAllMembers
  );

router
  .route("/getMember")
  .get(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    getAllMembers
  );

router
  .route("/memeberProfile")
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    getMembersProfile
  );

router
  .route("/EstateAdminsapproveMembership")
  .post(requireSignin, EstateAdminsApproveMembership);

router
  .route("/EstateAdminsapproveMembership")
  .post(requireSignin, EstateAdminsApproveMembership);

router.route("/getuserclans").get(requireSignin, getUserClans);

router
  .route("/Admingetuserclans")
  .get(requireSignin, check_User_is_Admins_of_clan, Estate_Admin_getUserClans)
  .post(requireSignin, isAdmin, registerAndCreateClan)
  .patch(requireSignin, isAdmin, confirmClan_Suspend_Approve_reject); //ok

router
  .route("/select_Admin_clan/:clanId")
  .get(
    requireSignin,
    checkClan_IsApproved_and_MemberApproved_Admin,
    Admin_Select__clan
  )
  .delete(
    requireSignin,
    checkClan_IsApproved_and_MemberApproved_Admin,
    Admin_Leave_Select_clan
  );

router
  .route("/select_user_clan/:clanId")
  .get(requireSignin, checkClan_IsAproved_and_MemberAproved, Select_clan)
  .delete(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved,
    Leave_Select_clan
  );

router.route("/leaveclan/:clanId").post(requireSignin, leaveClan); // ok
router.delete("/Adminsdelete/:clanId", requireSignin, isAdmin, deleteClan); //ok

router
  .route("/:clanId")
  .get(requireSignin, getClanById) //ok
  .patch(requireSignin, updateClan); //ok

router.route("/detail/:clanSlug").get(requireSignin, isAdmin, read);

router.get("/joinClan/:clanId", requireSignin, requestToJoinClan); // ok

router
  .route("/getMember/:memberID")
  .get(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    getSingleMembers
  );

export default router;
