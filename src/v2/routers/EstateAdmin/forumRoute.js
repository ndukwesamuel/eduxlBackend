import express from "express";

import {
  adminCreateForum,
  GetAllForum,
  DeleteForum,
  UpdateCreateForum,
} from "../../controllers/EstateAdmin/forum.js";
import { requireSignin, estateAdmin } from "../../../middlewares/auth.js";

const router = express.Router();

router
  .route("/")

  .post(requireSignin, estateAdmin, adminCreateForum);
router.route("/:clanId").get(requireSignin, estateAdmin, GetAllForum);
router
  .route("/:forumId/clan/:clanId")
  .delete(requireSignin, estateAdmin, DeleteForum)
  .patch(requireSignin, estateAdmin, UpdateCreateForum);

export default router;
