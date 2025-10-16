// routes/estate_admin_clan_route.js
import { Router } from "express";

import {
  CaptainCourt,
  CaptainCourt__test,
  CreateAVirtualAccountController,
  GetUserVirtualAccountController,
  GetUserVirtualAccountControllerFromDB,
  investigateMissingClanPhoneNumbers,
  processAllMemberVirtualAccounts,
  // processAllMemberVirtualAccounts_for_people_without_number,
  processAndGetAllMembersAccounts,
  updateMissingProfilePhoneNumbers,
  VirtualAccountController,
} from "../controllers/bankAPi.js";
import { requireSignin } from "../../middlewares/auth.js";
import { getAllMembersFake } from "../controllers/EstateAdmin/clan.js";

const BankingAPi = Router();

// Group guest features under /guest
// BankingAPi.use("/", VirtualAccountController);

BankingAPi.route("/").get(VirtualAccountController);
BankingAPi.route("/singleUser").get(
  requireSignin,
  GetUserVirtualAccountController
);
BankingAPi.route("/getALlUser").get(GetUserVirtualAccountControllerFromDB);

BankingAPi.route("/captaincreate").post(CaptainCourt).get(CaptainCourt__test);
BankingAPi.route("/processAllMemberVirtualAccounts")
  .get
  // processAllMemberVirtualAccounts
  // updateMissingProfilePhoneNumbers
  // investigateMissingClanPhoneNumbers
  // getAllMembersFake
  // processAndGetAllMembersAccounts
  // processAllMemberVirtualAccounts_for_people_without_number
  ();

BankingAPi.route("/create-virtual-account").post(
  requireSignin,
  CreateAVirtualAccountController
);
//   .patch(requireSignin, UpdateUserProfile);

export default BankingAPi;
