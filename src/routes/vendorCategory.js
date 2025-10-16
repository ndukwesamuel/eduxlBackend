import express from "express";
import { isAdmin, requireSignin } from "../middlewares/auth.js";
import {
  createVendorCategory,
  deleteVendorCategory,
  getAllVendorCategories,
  getVendorCategoryBySlug,
  getVendorsByCategory,
  updateVendorCategory,
} from "../controllers/vendorCategory.js";
import {
  createVendorSubCategory,
  deleteVendorSubCategory,
  getAllVendorSubCategories,
  getSubCategoryBySlug,
  getVendorsBySubCategory,
  updateVendorSubCategory,
} from "../controllers/vendorSubCategory.js";

const router = express.Router();

// Vendor category routes
router
  .route("/category")
  .get(createVendorCategory)
  .post(requireSignin, createVendorCategory);
router.put(
  "/category/:categoryId",
  requireSignin,
  isAdmin,
  updateVendorCategory
);
router.delete(
  "/category/:categoryId",
  requireSignin,
  isAdmin,
  deleteVendorCategory
);
router.get("/category/all", getAllVendorCategories);
router.get("/category/category/:slug", getVendorCategoryBySlug);
router.get("/category/vendors-by-category/:slug", getVendorsByCategory);

// Vendor subcategory routes
router.post(
  "/subcategory/create",
  requireSignin,
  isAdmin,
  createVendorSubCategory
);
router.put(
  "/subcategory/:categoryId",
  requireSignin,
  isAdmin,
  updateVendorSubCategory
);
router.delete(
  "/subcategory/:categoryId",
  requireSignin,
  isAdmin,
  deleteVendorSubCategory
);
router.get("/subcategory/all", getAllVendorSubCategories);
router.get("/subcategory/category/:slug", getSubCategoryBySlug);
router.get("/subcategory/vendors-by-category/:slug", getVendorsBySubCategory);

export default router;
