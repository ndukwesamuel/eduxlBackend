// routes/estate_admin_clan_route.js
import { Router } from "express";
import { requireSignin } from "../../middlewares/auth.js";
import { checkClan_IsAproved_and_MemberAproved_noParams } from "../../middlewares/clan.js";

import GuestRoute from "./EstateUser/GuestRoute.js";
import ClanRoute from "./EstateUser/ClanRoute.js";
import UserRoute from "./EstateUser/UserRoute.js";
import DomesticRoute from "./EstateUser/DomesticRoute.js";
import ErrandRoute from "./EstateUser/errandRoute.js";
import FeatureFlagRoute from "./EstateUser/FeatureFlagRoute.js";
import GuestErrandRoute from "./EstateUser/GuesterrandRoute.js";
const estateUserRoute = Router();

// Group guest features under /guest
estateUserRoute.use(
  "/guest",
  requireSignin,
  checkClan_IsAproved_and_MemberAproved_noParams,
  GuestRoute
);
estateUserRoute.use(
  "/userClan",
  requireSignin,
  checkClan_IsAproved_and_MemberAproved_noParams,
  ClanRoute
);
estateUserRoute.use(
  "/errand",
  requireSignin,
  checkClan_IsAproved_and_MemberAproved_noParams,
  ErrandRoute
);

estateUserRoute.use(
  "/guesterrand",
  requireSignin,
  // checkClan_IsAproved_and_MemberAproved_noParams,
  GuestErrandRoute
);
estateUserRoute.use(
  "/featureflag",
  requireSignin,
  checkClan_IsAproved_and_MemberAproved_noParams,
  FeatureFlagRoute
);
// v1rootRouter.use("/v1/errand", errandRoute);

estateUserRoute.use("/user", UserRoute);

estateUserRoute.use(
  "/domestic",
  requireSignin,
  checkClan_IsAproved_and_MemberAproved_noParams,
  DomesticRoute
);

export default estateUserRoute;
