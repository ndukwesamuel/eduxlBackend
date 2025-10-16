import express from "express";
import {
  AdminSeeAllProducts,
  UpdateProductStatus,
  createProduct,
  deleteProductById,
  getAllMyProducts,
  getAllProducts,
  getBySlug,
  getProductById,
  relatedProduct,
  searchProduct,
  updateProduct,
} from "../controllers/marketPlace.js";
import {
  createCategory,
  deleteCategory,
  getAllCategory,
  getCategoryBySlug,
  productsByCategory,
  updateCategory,
} from "../controllers/marketCategory.js";

import { requireSignin, isAdmin } from "../middlewares/auth.js";
import upload from "../helpers/multer.js";
import {
  checkClanAdmin,
  checkClan_IsApproved_and_MemberApproved_Admin,
  checkClan_IsAproved_and_MemberAproved,
  checkClan_IsAproved_and_MemberAproved_noParams,
  checkClan_IsAproved_and_UserAnAdmin_noParams,
} from "../middlewares/clan.js";

const router = express.Router();

router.get(
  "/products",
  requireSignin,
  checkClan_IsAproved_and_MemberAproved_noParams,
  getAllProducts
);

router.get(
  "/allclanproducts",
  requireSignin,
  checkClan_IsAproved_and_UserAnAdmin_noParams,
  AdminSeeAllProducts
);

router.get(
  "/myproduct",
  requireSignin,
  checkClan_IsAproved_and_MemberAproved_noParams,
  getAllMyProducts
);

router.post(
  "/product/create",
  requireSignin,
  checkClan_IsAproved_and_MemberAproved_noParams,
  createProduct
);

router
  .route("/myproduct/:productId")
  .delete(
    requireSignin,
    checkClan_IsAproved_and_MemberAproved_noParams,
    deleteProductById
  );

router.put(
  "/product/update/:productId",
  requireSignin,
  checkClan_IsAproved_and_MemberAproved_noParams,
  updateProduct
);

router.get("/product/:productId", getProductById);
router.get("/product/slug/:slug", getBySlug);
router.delete("/product/:productId", deleteProductById);
router.get("/product/search/:keyword", searchProduct);
router.get("/product/related/:productId", relatedProduct);
router.put("/product/status/:productId", requireSignin, UpdateProductStatus); // checkClanAdmin

// MarketCategory Routes
router.post("/category/create", requireSignin, isAdmin, createCategory);
router.put("/category/:categoryId", requireSignin, isAdmin, updateCategory);
router.delete("/category/:categoryId", requireSignin, isAdmin, deleteCategory);
router.get("/category/all", getAllCategory);
router.get("/category/:slug", getCategoryBySlug);
router.get("/category/products-by-category/:slug", productsByCategory);

export default router;
