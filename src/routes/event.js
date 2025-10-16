import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  getEventsByHostId,
  deleteEvent,
  updateEvent,
  read,
} from "../controllers/event.js";
import { requireSignin } from "../middlewares/auth.js";
import upload from "../helpers/multer.js";

const router = express.Router();

router.post(
  "/create-event",
  requireSignin,
  upload.single("photo"),
  createEvent
);
router.put(
  "/update-event/:eventId",
  requireSignin,
  upload.single("photo"),
  updateEvent
);
router.get("/list", getAllEvents); // it is admin that need to see all the private event so restict this to admin person only
router.get("/event/:eventId", getEventById);
router.get("/event-slug/:slug", read);
router.get("/host-events", requireSignin, getEventsByHostId);
router.delete("/event/:eventId", requireSignin, deleteEvent);

// router.get('/events-near-me', requireSignin, getEventsNearMe);
// router.get('/search-events', requireSignin, searchEvents);

export default router;
