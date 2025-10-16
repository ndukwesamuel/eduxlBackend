import express from "express";
import {
  createPublicEvent,
  createEventTicket,
  verifyTicket,
  getPublicEvents,
  updatePublicEvent,
  read,
  getPublicEventById,
  getPublicEventsByHostId,
  deletePublicEvent,
  searchPublicEvents,
  getFreeEvents,
  getPaidEvents,
  relatedEvents,
  verifyPayment,
  processEventTicket,
  processFreeEventTicket,
  processPaidEventTicket,
} from "../controllers/ticket.js";
import { requireSignin } from "../middlewares/auth.js";
import upload from "../helpers/multer.js";
import cache from "memory-cache";



const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl || req.url;

  const cachedData = cache.get(key);

  if (cachedData) {
    console.log(`Cache hit for key: ${key}`);
    res.setHeader('Cache-Control', 'public, max-age=60, must-revalidate');
    return res.json(cachedData);
  }

  res.sendResponse = res.json;
  res.json = (body) => {
    try {
      cache.put(key, body, 60 * 1000); 
      console.log(`Cache miss for key: ${key}`);
      res.setHeader('Cache-Control', 'public, max-age=60, must-revalidate');
      res.sendResponse(body);
    } catch (error) {
      console.error(`Error caching data for key: ${key}`, error);
      res.status(500).json({ error: 'Internal Server Error', errorMsg: error.message });
    }
  };

  next();
};





const router = express.Router();

router.post("/public-event/create", requireSignin, upload.single("photo"), createPublicEvent); //ok
router.put("/public-event/update/:eventId",requireSignin, upload.single("photo"), updatePublicEvent); //ok
router.get("/events/public", cacheMiddleware,  getPublicEvents); //ok
router.get("/public-event/:slug", read); // ok
router.get("/public/event/:eventId", getPublicEventById); //ok
router.get("/public/host-events", requireSignin, getPublicEventsByHostId); //ok
router.get("/related-event/:eventId/:categoryId",  relatedEvents); //ok
router.delete("/public-event/:eventId", requireSignin, deletePublicEvent); //ok
router.get("/verify-ticket/:eventId/:ticketId", verifyTicket); //ok
router.post("/events/ticket/:eventId", requireSignin, createEventTicket); //ok
router.get('/search-events', requireSignin, searchPublicEvents); //ok
router.get("/public-events/free", getFreeEvents);
router.get("/public-events/paid", getPaidEvents);
// router.get('/events-near-me', requireSignin, getEventsNearMe);







// Payment
router.post("/verify-payment", requireSignin,  verifyPayment);

router.post('/process-free-event-ticket/:eventId', requireSignin, async (req, res) => {
  try {
    await processFreeEventTicket(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', errorMsg: error.message });
  }
});

router.post('/process-paid-event-ticket/:eventId', async (req, res) => {
  try {
    await processPaidEventTicket(req, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', errorMsg: error.message });
  }
});




export default router;
