import jwt from "jsonwebtoken";
import PublicEvent from "../models/ticket.js";
import Category from "../models/category.js";
import {
  calculateTicket,
  generateQRCode,
  processPayment,
} from "../helpers/ticket.js";
import { sendTicketEmail } from "../helpers/email.js";
import shortid from "shortid";
import slugify from "slugify";
import { getTotalPages, preparePagination } from "../helpers/pagination.js";
import { cloudinary } from "../helpers/cloudinaryConfig.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const createPublicEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      venue,
      category,
      event_date,
      starts,
      ends,
      price,
      available_tickets,
      isFree,
    } = req.body;
    const imageFile = req.file;

    const host_id = req.user._id;

    const cat = await Category.findOne({
      slug: slugify(category, { lower: true }),
    });

    if (!cat) {
      return res.status(404).json({ error: "Category not found" });
    }

    const eventId = shortid.generate();

    const newEvent = new PublicEvent({
      title,
      description,
      category: cat._id,
      venue,
      event_date,
      starts,
      ends,
      eventId,
      host_id,
      price,
      available_tickets,
      isFree,
    });

    newEvent.slug = slugify(title).toLowerCase();

    if (imageFile) {
      const imageResult = await cloudinary.uploader.upload(imageFile.path);
      newEvent.photo = imageResult.secure_url;
    }

    const savedEvent = await newEvent.save();

    res
      .status(201)
      .json({ message: "Event created successfully", event: savedEvent });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to create event", errorMsg: error.message });
  }
};

export const verifyTicket = async (req, res) => {
  try {
    const { eventId, ticketId } = req.params;

    const event = await PublicEvent.findOne({ eventId });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.available_tickets === 0) {
      return res.status(403).json({ error: "Event is sold out" });
    }

    const decodedToken = jwt.verify(ticketId, process.env.JWT_SECRET);

    const { userId } = decodedToken;
    const isValidTicket =
      userId === decodedToken.userId && eventId === decodedToken.eventId;

    if (isValidTicket) {
      res.json({ message: "Ticket is valid" });
    } else {
      res.status(403).json({ error: "Invalid ticket" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to verify ticket", errorMsg: error.message });
  }
};

export const createEventTicket = async (req, res) => {
  try {
    const { eventId } = req.params;
    const baseUrl = "www.pausepoint.net";

    const {
      name,
      email,
      phone,
      numberOfTickets,
      paymentMethod,
      cardNumber,
      expirationDate,
      cvv,
    } = req.body;

    const event = await PublicEvent.findOne({ _id: eventId });
    console.log({
      event,
    });
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Process Free Event
    if (event.isFree) {
      const ticketId = jwt.sign(
        { eventId, userId: req.user._id },
        process.env.JWT_SECRET
      );
      const ticketDetails = calculateTicket(event, numberOfTickets);
      const qrcode = await generateQRCode(baseUrl, ticketId);

      await sendTicketEmail(email, event.title, ticketDetails, qrcode);
      await PublicEvent.findOneAndUpdate(
        { eventId },
        {
          $inc: { sold_tickets: numberOfTickets },
          $set: {
            available_tickets: event.available_tickets - numberOfTickets,
          },
        }
      );

      return res.json({
        message: "Ticket for free event sent successfully",
        ticketId,
        ticketDetails,
        qrcode,
      });
    }

    // If it's not a free event, proceed with payment processing
    const ticketDetails = calculateTicket(event, numberOfTickets);
    const ticketId = jwt.sign(
      { eventId, userId: req.user._id },
      process.env.JWT_SECRET
    );

    await processPayment({
      ticketId,
      paymentMethod,
      cardNumber,
      expirationDate,
      cvv,
    });

    const qrcode = await generateQRCode(baseUrl, ticketId);

    await PublicEvent.findOneAndUpdate(
      { eventId },
      {
        $inc: { sold_tickets: numberOfTickets },
        $set: { available_tickets: event.available_tickets - numberOfTickets },
      }
    );

    await sendTicketEmail(email, event.title, ticketDetails, qrcode);

    res.json({
      message: "Ticket purchased successfully",
      ticketId,
      ticketDetails,
      qrcode,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to create ticket", errorMsg: error.message });
  }
};

export const getPublicEvents = async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const offset = (page - 1) * limit;

    const events = await PublicEvent.find()
      .limit(parseInt(limit))
      .skip(offset)
      .sort({ createdAt: -1 });
    if (!events) {
      return res.status(404).json({ error: "Not Found" });
    }

    const totalEvents = await PublicEvent.countDocuments();
    const totalPages = getTotalPages(totalEvents, parseInt(limit));

    res.status(200).json({
      totalPages,
      totalEvents,
      events,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to retrieve events", errorMsg: error.message });
  }
};

export const getFreeEvents = async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const offset = (page - 1) * limit;

    const freeEvents = await PublicEvent.find({ isFree: true })
      .limit(parseInt(limit))
      .skip(offset)
      .sort({ createdAt: -1 });

    const totalFreeEvents = await PublicEvent.countDocuments({ isFree: true });
    const totalPages = getTotalPages(totalFreeEvents, parseInt(limit));

    res.status(200).json({
      totalPages,
      totalEvents: totalFreeEvents,
      events: freeEvents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to retrieve free events",
      errorMsg: error.message,
    });
  }
};

export const getPaidEvents = async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const offset = (page - 1) * limit;

    const paidEvents = await PublicEvent.find({ isFree: false })
      .limit(parseInt(limit))
      .skip(offset)
      .sort({ createdAt: -1 });

    const totalPaidEvents = await PublicEvent.countDocuments({ isFree: false });
    const totalPages = getTotalPages(totalPaidEvents, parseInt(limit));

    res.status(200).json({
      totalPages,
      totalEvents: totalPaidEvents,
      events: paidEvents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to retrieve paid events",
      errorMsg: error.message,
    });
  }
};

export const updatePublicEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      title,
      description,
      category,
      venue,
      event_date,
      starts,
      ends,
      price,
      available_tickets,
    } = req.body;
    const imageFile = req.file;

    const updatedEvent = await PublicEvent.findByIdAndUpdate(
      eventId,
      {
        title,
        description,
        category,
        venue,
        event_date,
        starts,
        ends,
        price,
        available_tickets,
        slug: slugify(title).toLowerCase(),
      },
      { new: true }
    );

    if (imageFile) {
      const imageResult = await cloudinary.uploader.upload(imageFile.path);
      updatedEvent.photo = imageResult.secure_url;
    }

    await updatedEvent.save();

    res.json({ message: "Event Updated successfully", updatedEvent });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to update event", errorMsg: error.message });
    res
      .status(500)
      .json({ error: "Failed to update event", errorMsg: error.message });
  }
};

export const read = async (req, res) => {
  try {
    const event = await PublicEvent.findOne({ slug: req.params.slug });
    res.json(event);
  } catch (err) {
    console.log(err);
    return res.status(400).json(err.message);
  }
};

export const getPublicEventById = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await PublicEvent.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    res.status(200).json({ message: "Event retrieved successfully", event });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: `Server error, please try again later.`,
      errorMsg: error.message,
    });
  }
};

export const getPublicEventsByHostId = async (req, res) => {
  try {
    const hostId = req.user._id;
    const { page, limit } = req.query;
    const { page: offset, limit: count } = preparePagination(page, limit);

    console.log(hostId);
    const userEvents = await PublicEvent.find({ host_id: hostId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(count)
      .populate("host_id", "name");

    const totalEvents = await PublicEvent.countDocuments({ host_id: hostId });

    const totalPages = getTotalPages(totalEvents, count);

    res.status(200).json({
      message: "User events retrieved successfully",
      totalPages,
      totalEvents,
      userEvents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: `Server error, please try again later.`,
      errorMsg: error.message,
    });
  }
};

export const deletePublicEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await PublicEvent.findOne({ eventId });
    if (!event) {
      return res.status(404).json({ error: "Event Not Found" });
    }
    const deletedEvent = await PublicEvent.findByIdAndDelete(event._id);

    if (!deletedEvent) {
      return res.status(404).json({ error: "Event Not Found" });
    }

    res.json({ message: `Event deleted successfully`, deletedEvent });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to delete event", errorMsg: error.message });
  }
};

export const searchPublicEvents = async (req, res) => {
  try {
    const searchKey = Object.keys(req.query)[0];
    const searchValue = Object.values(req.query)[0];

    const { page, limit } = req.query;
    const { page: offset, limit: count } = preparePagination(page, limit);

    if (!searchKey) {
      return await getPublicEvents(req, res);
    }

    let searchResult;
    if (searchKey && searchKey.toLowerCase() === "category") {
      searchResult = await searchByCategory(
        searchValue.toLowerCase(),
        offset,
        count
      );
    }

    if (searchKey && searchKey.toLowerCase() === "title") {
      searchResult = await searchByTitle(
        searchValue.toLowerCase(),
        offset,
        count
      );
    }

    return res.status(200).json({
      error: false,
      message: "Events based on your search criteria.",
      data: searchResult,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: `Server error, please try again later. ${error}`,
    });
  }
};

export const searchByCategory = async (categorySlug, offset, count) => {
  try {
    const category = await Category.findOne({ slug: categorySlug });

    if (!category) {
      throw new Error(`Category not found for slug: ${categorySlug}`);
    }

    const events = await PublicEvent.find({ category: category._id })
      .skip(offset)
      .limit(count)
      .sort({ createdAt: -1 });

    const totalEvents = await PublicEvent.countDocuments({
      category: category._id,
    });
    const totalPages = getTotalPages(totalEvents, count);

    return { events, totalPages, totalEvents };
  } catch (error) {
    throw new Error(`Failed to search by category: ${error.message}`);
  }
};

export const searchByTitle = async (titleSlug, offset, count) => {
  try {
    const events = await PublicEvent.find({ slug: titleSlug })
      .skip(offset)
      .limit(count)
      .sort({ createdAt: -1 });

    const totalEvents = await PublicEvent.countDocuments({ slug: titleSlug });
    const totalPages = getTotalPages(totalEvents, count);

    return { events, totalPages, totalEvents };
  } catch (error) {
    throw new Error(`Failed to search by title: ${error.message}`);
  }
};

// export const getRelatedEvents = async (req, res) => {
//   try {
//     const { eventId } = req.params;

//     const event = await PublicEvent.findById(eventId).populate('category');

//     if (!event) {
//       return res.status(404).json({ error: 'Event not found' });
//     }

//     const categoryId = event.category._id;

//     const relatedEvents = await PublicEvent.find({ category: categoryId });

//     res.json({ events: relatedEvents });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to retrieve related events' });
//   }
// };

export const relatedEvents = async (req, res) => {
  try {
    const { eventId, categoryId } = req.params;
    const related = await PublicEvent.find({
      category: categoryId,
      _id: { $ne: eventId },
    })
      .populate("category")
      .limit(3);
    res.json(related);
  } catch (err) {
    console.log(err);
  }
};

const { PAYSTACK_SECRET_KEY } = process.env;
// console.log(PAYSTACK_SECRET_KEY);

// https://paystack.com/pay/xl48-totqr  //clan yearly
// https://paystack.com/pay/csbo-gaela //monthly

export const verifyPayment = async (reference) => {
  try {
    const verificationResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );
 
    const { data } = verificationResponse;

    if (data.data.status === "success") {
      // logic for successful payment verification
      // redirect /success
 
      return { success: true };
    } else {
      // Handle unsuccessful payment verification
      return { success: false, message: "Payment verification failed" };
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return { success: false, message: "Internal server error" };
  }
};

// export const getEventsNearMe = async (req, res) => {
//   try {
//     const lon = Number(req.query.lon);
//     const lat = Number(req.query.lat);
//     const distanceInKm = Number(req.query.distanceInKm) || 10;

//     const { page, limit } = req.query;
//     const { page: offset, limit: count } = preparePagination(page, limit);

//     const eventsNearMe = await Event.search()
//       .where("locationPoint")
//       .inRadius(
//         (circle) => circle.origin(lon, lat).radius(Number(distanceInKm)).km
//       )
//       .sortDescending("createdAt")
//       .where("locationPoint")
//       .inRadius(
//         (circle) => circle.origin(lon, lat).radius(Number(distanceInKm)).km
//       )
//       .sortDescending("createdAt")
//       .return.page(offset, count);

//     const totalEvents = await Event.search()
//       .where("locationPoint")
//       .inRadius(
//         (circle) => circle.origin(lon, lat).radius(Number(distanceInKm)).km
//       )
//       .where("locationPoint")
//       .inRadius(
//         (circle) => circle.origin(lon, lat).radius(Number(distanceInKm)).km
//       )
//       .return.count();

//     const totalPages = getTotalPages(totalEvents, count);

//     return res.status(200).json({
//       message: "Here are the events happening near you.",
//       data: {
//         eventsNearMe,
//         totalEvents,
//         totalPages,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: `Server error, please try again later.`,
//       errorMsg: error.message,
//     });
//   }
// };

export const processFreeEventTicket = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, email, phone, numberOfTickets } = req.body;

    const event = await PublicEvent.findById({ _id: eventId });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const ticketDetails = calculateTicket(event, numberOfTickets);

    const ticketId = jwt.sign(
      { eventId, userId: req.user._id },
      process.env.JWT_SECRET
    );

    ticketDetails.ticketId = ticketId;

    const qrcode = await generateQRCode("www.pausepoint.net", ticketId);

    await sendTicketEmail(
      email,
      name,
      phone,
      event.title,
      ticketDetails.ticketDetails,
      qrcode,
      ticketId
    );

    await PublicEvent.findByIdAndUpdate(
      { _id: eventId },
      {
        $inc: { sold_tickets: numberOfTickets },
        $set: { available_tickets: event.available_tickets - numberOfTickets },
      },
      { new: true }
    );

    return res.json({
      message: "Free ticket processed successfully",
      ticketDetails,
      qrcode,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to process free ticket",
      errorMsg: error.message,
    });
  }
};

export const processPaidEventTicket = async (
  eventId,
  user,
  name,
  email,
  phone,
  numberOfTickets,
  paymentMethod,
  cardNumber,
  expirationDate,
  cvv
) => {
  const baseUrl = "www.pausepoint.net";

  const event = await PublicEvent.findOne({ eventId });

  if (!event) {
    throw new Error("Event not found");
  }

  const ticketDetails = calculateTicket(event, numberOfTickets);
  const ticketId = jwt.sign(
    { eventId, userId: user._id },
    process.env.JWT_SECRET
  );

  await processPayment({
    ticketId,
    paymentMethod,
    cardNumber,
    expirationDate,
    cvv,
  });

  const qrcode = await generateQRCode(baseUrl, ticketId);

  await PublicEvent.findOneAndUpdate(
    { eventId },
    {
      $inc: { sold_tickets: numberOfTickets },
      $set: { available_tickets: event.available_tickets - numberOfTickets },
    }
  );

  await sendTicketEmail(email, event.title, ticketDetails, qrcode);

  return {
    message: "Ticket purchased successfully",
    ticketId,
    ticketDetails,
    qrcode,
  };
};

export const processEventTicket = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { paymentMethod, cardNumber, expirationDate, cvv, ...ticketDetails } =
      req.body;

    const event = await PublicEvent.findOne({ eventId });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.isFree) {
      const { name, email, phone, numberOfTickets } = ticketDetails;
      await processFreeEventTicket(
        { params: { eventId }, body: { name, email, phone, numberOfTickets } },
        res
      );
    } else {
      await processPaidEventTicket(req, res);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to process event ticket",
      errorMsg: error.message,
    });
  }
};
