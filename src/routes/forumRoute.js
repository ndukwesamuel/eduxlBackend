import express from "express";
import {
  Admin_Create_announcement,
  Admin_Get_All_announcement,
  Comment_on_Forum,
  CreateForum,
  DeleteForum,
  GetAllForum,
  GetSingleForum,
  GetUserForum,
  Like_and_Dislike_Forum,
  UpdateComment,
  UpdateCreateForum,
  UserCreateForum,
} from "../controllers/Forum.js";
import { requireSignin } from "../middlewares/auth.js";
import {
  checkClan_IsApproved_and_MemberApproved_Admin,
  checkClan_IsAproved_and_MemberAproved,
  checkClan_IsAproved_and_MemberAproved_noParams,
  checkClan_IsAproved_and_UserAnAdmin_noParams,
} from "../middlewares/clan.js";
const router = express.Router();

router
  .route("/")
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    GetAllForum
  )
  .post(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    CreateForum
  );

/// this was created to correct the other erros

router
  .route("/admin-announcement")
  .get(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    Admin_Get_All_announcement
  )
  .post(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    Admin_Create_announcement
  );

router
  .route("/user")
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    GetUserForum
  )
  .post(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    UserCreateForum
  );

router
  .route("/comment")
  .post(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    Comment_on_Forum
  );

router
  .route("/user/:forumId")
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    GetSingleForum
  )
  .delete(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    DeleteForum
  );
// .patch(
//   // requireSignin,
//   // checkClan_IsAproved_and_MemberAproved_noParams,
//   // UserCreateForum
// );

router
  .route("/:clanId")
  // .get(requireSignin, checkClan_IsAproved_and_MemberAproved, GetAllForum)

  // this will soon remove for now i dont want to spoil anythignthat why it not removed
  .post(
    requireSignin,
    checkClan_IsApproved_and_MemberApproved_Admin,
    CreateForum
  )
  .delete(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    DeleteForum
  );

router
  .route("/:clanId/:forumId")
  .get(requireSignin, GetSingleForum)
  .patch(requireSignin, UpdateCreateForum);

router
  .route("/like/:clanId/:forumId")
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved,
    Like_and_Dislike_Forum
  );

// router.all((req, res) => {
//   res.status(405).json({
//     message: `Method ${req.method} not allowed on ${req.originalUrl}`,
//   });
// });

export default router;
