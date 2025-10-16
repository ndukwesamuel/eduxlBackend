import express from "express";
import { clanSubscribe, handleSubscriptionWebhooks } from "../controllers/payments/clanSubscriptions.js";

const router = express.Router();

router.post("/:clanId", clanSubscribe);
router.post("/paystack-webhook", handleSubscriptionWebhooks);


export default router;