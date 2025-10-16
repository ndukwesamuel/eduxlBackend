import express from "express";
import {
  createPoll,
  getAllPoll,
  vote,
  getPollById,
  editPoll,
  deletePoll,
  usergetAllPoll,
} from "../controllers/poll.js";
import {
  checkClan_IsAproved_and_UserAnAdmin_noParams,
  checkClan_IsAproved_and_MemberAproved_noParams,
  checkClan_IsAproved_and_MemberAproved,
} from "../middlewares/clan.js";
import { requireSignin } from "../middlewares/auth.js";

const router = express.Router();

router
  .route("/")
  .post(requireSignin, checkClan_IsAproved_and_UserAnAdmin_noParams, createPoll)
  .get(requireSignin, checkClan_IsAproved_and_UserAnAdmin_noParams, getAllPoll);

router
  .route("/user")
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    usergetAllPoll
  );

router
  .route("/:id")
  .get(requireSignin, getPollById)
  .patch(requireSignin, checkClan_IsAproved_and_UserAnAdmin_noParams, editPoll)
  .delete(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    deletePoll
  );

router.route("/:id/vote").post(requireSignin, vote);

export default router;
