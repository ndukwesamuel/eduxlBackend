import { Router } from "express";
import { GetAllFeatureFlag } from "../../controllers/SuperAdmin/FeatureFlag";

const router = Router();
router
  .route("/")
  // .post(superAdminCreateForum)
  .get(GetAllFeatureFlag);
// .patch(superAdminUpdateAnnouncement)
// .delete(superAdminDeleteAnnouncement); // Assuming you want to allow patching to update all forums
// router.route("/:forumId").delete(DeleteForum).patch(UpdateCreateForum);

export default router;
