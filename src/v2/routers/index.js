import { Router } from "express";

import authRouter from "./auth.js";
import generalRoute from "./generalRoute.js";
import estate_admin_clan_routeRouter from "./estate_admin_clan_route.js";
import SuperAdminRoute from "./superadmin.js";
import FakeRoute from "./fake.js";
import {
  // isAdmin,
  isSuperadmin,
  requireSignin,
  // estateAdmin,
} from "../../middlewares/auth.js";
import estateUserRoute from "./estateUserRoute.js";
import marketPlaceRoute from "./EstateAdmin/marketPlaceRoute.js";
// import runnerRoute from "./EstateAdmin/runnerRoute.js";
// import errandRoute from "./EstateUser/errandRoute.js";
import errandRunnerRoute from "./estateRunner/errandRunner.js";
import GuestUserRoute from "./GuestUser/guestuser.js";
import forumRoute from "./EstateAdmin/forumRoute.js";
import superAdminForumRoute from "./superAdmin/superAdminForumRoute.js";
import clan from "../../models/clan.js";
import BankingAPi from "./bankApi.js";
const v1rootRouter = Router();

v1rootRouter.use("/", FakeRoute);
v1rootRouter.use("/v1", estateUserRoute);
v1rootRouter.use("/v1/auth", authRouter);
v1rootRouter.use("/v3/bank", BankingAPi);
v1rootRouter.use("/v1/general", generalRoute);
v1rootRouter.use("/v1/clan", estate_admin_clan_routeRouter);
v1rootRouter.use("/v1/products", marketPlaceRoute);
v1rootRouter.use("/v1/runner/", errandRunnerRoute);
v1rootRouter.use("/v1/clan-forum", forumRoute);
v1rootRouter.use("/v1/admin-forum", requireSignin, superAdminForumRoute);

v1rootRouter.use("/v1/admin", requireSignin, isSuperadmin, SuperAdminRoute);

export default v1rootRouter;
