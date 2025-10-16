import express from "express";
import { GetUserCurrentClan } from "../../controllers/EstateUser/Clan.js";

const router = express.Router();

router
  .route("/")
  // .post(superAdminCreateForum)
  .get(GetUserCurrentClan);
// .patch(superAdminUpdateAnnouncement)
// .delete(superAdminDeleteAnnouncement); // Assuming you want to allow patching to update all forums
// router.route("/:forumId").delete(DeleteForum).patch(UpdateCreateForum);

export default router;
