import { Router } from "express";
import {
  superAdminCreateForum,
  GetAllForum,
  DeleteForum,
  UpdateCreateForum,
  superAdminUpdateAnnouncement,
  superAdminDeleteAnnouncement,
} from "../../controllers/SuperAdmin/superAdminForum.js";
import { getAccessToFeatureFlag } from "../../controllers/EstateUser/FeatureFlag.js";
const router = Router();
router
  .route("/")
  // .post(superAdminCreateForum)
  .get(getAccessToFeatureFlag);
// .patch(superAdminUpdateAnnouncement)
// .delete(superAdminDeleteAnnouncement); // Assuming you want to allow patching to update all forums
// router.route("/:forumId").delete(DeleteForum).patch(UpdateCreateForum);

export default router;
