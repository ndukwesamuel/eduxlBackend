// routes/EstateUser/Guest.js
import express from "express";
import { createDomesticstaff } from "../../controllers/EstateUser/DomesticStaff.js";

const router = express.Router();

router.post("/", createDomesticstaff);

export default router;
