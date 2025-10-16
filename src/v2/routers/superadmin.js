import express from "express";
// import { requireSignin, isAdmin } from "../middlewares/auth.js";
import {
  esatetAdminlogin,
  getAllEstatesForAdmin,
} from "../controllers/auth.js";
import { validateLogin } from "../utils/validator.js";
import { isAdmin, requireSignin } from "../../middlewares/auth.js";
import {
  createEstateWithDevice,
  getAllClans,
  getAllPhysicalDeviceClans,
  getClanDetails,
  getClans,
  kakaupdateClanSettings,
  SupercreateClan,
  TestThis,
  updateClanSettings,
  updateClanSettings_str_aprtmenttype,
  // SueprcreateClan,
} from "../controllers/SuperAdmin/clan.js";
import { getAllClanProducts } from "../controllers/SuperAdmin/marketPlace.js";
import { adminGetAllProducts } from "../controllers/EstateAdmin/marketPlace.js";
import {
  addRunner,
  getEstateRunners,
} from "../controllers/EstateAdmin/runner.js";
import {
  GetAllForum,
  superAdminCreateForum,
  superAdminDeleteAnnouncement,
  superAdminUpdateAnnouncement,
} from "../controllers/SuperAdmin/superAdminForum.js";
import { GetAllFeatureFlag } from "../controllers/SuperAdmin/FeatureFlag.js";
import { giveFreeErrands } from "../controllers/SuperAdmin/User.js";
import {
  AdminaddRunner,
  AdminUpdateRunner,
  GetAllRunner,
  GetErrands,
} from "../controllers/SuperAdmin/Errand.js";

const router = express.Router();

router.route("/getAllUserAccount").patch(updateClanSettings);

router.route("/clan-settings").patch(updateClanSettings);
router.route("/clan-settings").get(kakaupdateClanSettings);
router.route("/free-errand-for-users").patch(giveFreeErrands);

router
  .route("/clan-settings-str-aprt")
  .patch(updateClanSettings_str_aprtmenttype);

router
  .route("announcement")
  .post(superAdminCreateForum)
  .get(GetAllForum)
  .patch(superAdminUpdateAnnouncement)
  .delete(superAdminDeleteAnnouncement);

router
  .route("/physicalEstate")
  .post(createEstateWithDevice)
  .get(getAllPhysicalDeviceClans)
  .patch(TestThis);

router.route("/zzzzz").post(TestThis);
// .delete(superAdminDeleteAnnouncement);

router
  .route("/flagfeature")
  // .post(superAdminCreateForum)
  .get(GetAllFeatureFlag);
// .patch(superAdminUpdateAnnouncement)
// .delete(superAdminDeleteAnnouncement);

router.route("/runner").post(addRunner).get(GetAllRunner);
router
  .route("/errands")
  .get(GetErrands)
  .post(AdminaddRunner)
  .patch(AdminUpdateRunner);

// router.patch("/deactivate", requireSignin, estateAdmin, deactivateRunner);

router.post("/create-estate", SupercreateClan);
router.get("/get-all-estate", getClans);
router.get("/market-place", getAllClanProducts);
router.get("/:clanId/products", adminGetAllProducts);

router.get("/get--estate/:id", getClanDetails);

// router.get("/all-estate-admin-level", requireSignin, getAllEstatesForAdmin);

export default router;
