import express from "express";
// import { requireSignin, isAdmin } from "../middlewares/auth.js";
import {
  esatetAdminlogin,
  getAllEstatesForAdmin,
  HappyLandUpdate,
  Register,
} from "../controllers/auth.js";
import { validateLogin } from "../utils/validator.js";
import { requireSignin } from "../../middlewares/auth.js";

const router = express.Router();

router.post("/esatet-admin-login", validateLogin, esatetAdminlogin);
router.post("/user-register", Register);
router.get("/all-estate-admin-level", requireSignin, getAllEstatesForAdmin);
router.post("/happy-land", HappyLandUpdate);

export default router;
