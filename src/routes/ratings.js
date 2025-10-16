import express from "express";
import { addOrUpdateRating, deleteRating, getAllRatings } from "../controllers/ratings.js";
import { requireSignin } from "../middlewares/auth.js";


const router = express.Router();

router.post("/", requireSignin, addOrUpdateRating) // ok
router.get("/all", requireSignin, getAllRatings) // ok
router.delete("/:ratingId", requireSignin, deleteRating) // ok


export default router;