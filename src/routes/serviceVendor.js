import express from "express";
import upload from "../helpers/multer.js";
import { isAdmin, requireSignin } from "../middlewares/auth.js";
import {
  createServiceVendorAccount,
  Delete_Vendor,
  deleteVendorAccount,
  getAllVendors,
  getVendorById,
  GetVendorReview,
  getVendorsByCategory,
  Like_and_Dislike_Service_Vendor,
  searchVendorByCategoryOrSubCategory,
  Service_Vendor_Review,
  updateServiceVendorAccount,
  UsergetAllVendors,
} from "../controllers/serviceVendor.js";
import {
  deleteVendorRating,
  getAllRatingsOfAVendor,
  getVendorRatingById,
  rateVendor,
} from "../controllers/vendorRating.js";
import {
  checkClan_IsAproved_and_MemberAproved_noParams,
  checkClan_IsAproved_and_UserAnAdmin_noParams,
  checkClanAdmin,
} from "../middlewares/clan.js";
import {
  createVendorCategory,
  getAllVendorCategories,
} from "../controllers/vendorCategory.js";

const router = express.Router();

router.get(
  "/",
  requireSignin,
  checkClan_IsAproved_and_MemberAproved_noParams,
  UsergetAllVendors
);

router
  .route("/category")
  .get(getAllVendorCategories)
  .post(requireSignin, createVendorCategory);

router
  .route("/estate-admin")
  .get(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    getAllVendors
  )
  .post(
    requireSignin,
    checkClan_IsAproved_and_UserAnAdmin_noParams,
    // upload.single("photo"),
    createServiceVendorAccount
  )
  .delete(requireSignin, Delete_Vendor);

router
  .route("/review-rate-service")
  .post(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    Service_Vendor_Review
  )
  .get(
    requireSignin,
    // checkClan_IsAproved_and_MemberAproved_noParams,
    GetVendorReview
  );

router
  .route("/like-dislike/:serviceId")
  .get(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    Like_and_Dislike_Service_Vendor
  );

// router.post(
//   "/",
//   requireSignin,
//   checkClan_IsAproved_and_UserAnAdmin_noParams,
//   upload.single("photo"),
//   createServiceVendorAccount
// );
router.put(
  "/update/:vendorId",
  requireSignin,
  upload.single("photo"),
  updateServiceVendorAccount
);
router.get("/all", getAllVendors);
router.get("/:vendorId", getVendorById);
router.get("/category/:categoryId", getVendorsByCategory);
router.post("/search", searchVendorByCategoryOrSubCategory);
router.delete(
  "/:vendorId",
  requireSignin,
  isAdmin,
  checkClanAdmin,
  deleteVendorAccount
);

// vendorRating Routes
router.post("/rating/:vendorId", requireSignin, rateVendor);
router.get("/ratings/:vendorId", getAllRatingsOfAVendor);
router.get("/rating/:ratingId", getVendorRatingById);
router.delete("/rating/:ratingId", deleteVendorRating);

export default router;
