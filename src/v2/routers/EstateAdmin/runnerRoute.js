import express from "express";

import {
  addRunner,
  getEstateRunners,
  deactivateRunner,
} from "../../controllers/EstateAdmin/runner.js";
import { estateAdmin, requireSignin } from "../../../middlewares/auth.js";

const router = express.Router();

router.post("/", requireSignin, estateAdmin, addRunner);
router.get("/:clanId", requireSignin, estateAdmin, getEstateRunners);
router.patch("/deactivate", requireSignin, estateAdmin, deactivateRunner);

export default router;
