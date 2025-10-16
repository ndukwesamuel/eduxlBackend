import express from "express";
import { requireSignin, isAdmin } from "../middlewares/auth.js";
import {
  register,
  login,
  secret,
  forgotPassword,
  resetPassword,
  updateUserpushtoken,
  ChangePassword,
  sendOTP,
  verifyOTP,
  mobile_user_login,
  Creat_New_Passowrd,
  deleteAccount,
  AdminVersion,
  updateVersion,
  registerTestUsers,
} from "../controllers/auth.js";

const router = express.Router();

router.get("/checkversion", AdminVersion).post("/checkversion", updateVersion);
router.post("/register", register);
router.get("/registerTestUsers", registerTestUsers);

router.post("/login", login);
router.get("/deleteAccount", requireSignin, deleteAccount);
router.post("/mobile-user-login", mobile_user_login);

router.get("/auth-check", requireSignin, (req, res) => {
  res.json({ ok: true });
});
router.get("/admin-check", requireSignin, isAdmin, (req, res) => {
  res.json({ ok: true });
});

router.get("/secret", requireSignin, isAdmin, secret);
router.get("/change-password", requireSignin, ChangePassword);

router.post("/forgot-password", forgotPassword);
router.post("/reset-forgotten-password", Creat_New_Passowrd);
router.get("/reset-password", (req, res) => {
  res.json({ success: true, message: "Reset Token generated" });
});
router.post("/reset-password", resetPassword);

router
  .route("/pushtoken")
  .get(requireSignin, updateUserpushtoken)
  .patch(requireSignin, updateUserpushtoken);

router.route("/send-otp").post(sendOTP);
router.route("/verify-otp").post(verifyOTP);

// router.all((req, res) => {
//   res.status(405).json({
//     message: `Method ${req.method} not allowed on ${req.originalUrl}`,
//   });
// });

export default router;
