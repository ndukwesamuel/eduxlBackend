import express from "express";
import {
  getAvailableErrands,
  updateErrandStatus,
  acceptErrand,
  getMyErrands,
  assignedTogetAvailableErrands,
} from "../../controllers/EstateRunner/errandRunner.js";
import { requireSignin } from "../../../middlewares/auth.js";
import { GetAllErand } from "../../controllers/GuestUser/errand.js";
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello from user router!");
});

// router.route("/errands").get(requireSignin, getALlMyErrands);
router.route("/Errand").get(GetAllErand);
// .patch(requireSignin, updateErrandStatus);
// router.get("/me", requireSignin, assignedTogetAvailableErrands);

// router.patch("/:errandId/accept", requireSignin, acceptErrand);

export default router;
