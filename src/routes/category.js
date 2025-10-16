import express from "express";
import { requireSignin, isAdmin } from "../middlewares/auth.js";
import {
  create,
  update,
  remove,
  list,
  read,
  eventsByCategory,
} from "../controllers/category.js";

const router = express.Router();


router.post("/category", requireSignin, isAdmin, create);
router.put("/category/:categoryId", requireSignin, isAdmin, update);
router.delete("/category/:categoryId", requireSignin, isAdmin, remove);
router.get("/public-events/categories", list);
router.get("/category/:slug", read);
router.get("/events-by-category/:slug", eventsByCategory);

export default router;


