import express from "express";
import {
  UpdateProductStatus,
  adminGetAllProducts,
} from "../../controllers/EstateAdmin/marketPlace.js";
import { estateAdmin, requireSignin } from "../../../middlewares/auth.js";

const router = express.Router();

router.get("/:clanId", requireSignin, estateAdmin, adminGetAllProducts);

router.put(
  "/status/:productId",
  requireSignin,
  estateAdmin,
  UpdateProductStatus
);

export default router;
