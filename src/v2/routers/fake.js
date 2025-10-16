import express from "express";
import { registerTestUsers } from "../controllers/fake.js";

const router = express.Router();

router.get("/", registerTestUsers);

export default router;
