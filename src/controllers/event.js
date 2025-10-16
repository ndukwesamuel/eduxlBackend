import Event from "../models/event.js";
import { sendInvitationEmail, sendTicketEmail } from "../helpers/email.js";
import shortid from "shortid";
import slugify from "slugify";
import { calculateDistance } from "../helpers/location.js";
import { cloudinary } from "../helpers/cloudinaryConfig.js";
import { preparePagination, getTotalPages } from "../helpers/pagination.js";
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      event_date,
      start_time,
      end_time,
      number_of_guests,
      venue,
      add_guests,
    } = req.body;

    const host_id = req.user._id;
    const imageFile = req.file;

    const invitation_link = `www.pausepoint.net/guest-invite/${shortid.generate()}`;

    const newEvent = new Event({
      title,
      description,
      event_date,
      start_time,
      end_time,
      number_of_guests,
      venue,
      host_id,
      add_guests,
      invitation_link,
    });

    newEvent.slug = slugify(title).toLowerCase();

    if (imageFile) {
      const imageResult = await cloudinary.uploader.upload(imageFile.path);
      newEvent.photo = imageResult.secure_url;
    }

    const emailTo = "peteromu76@gmail.com";
    // await sendInvitationEmail(emailTo, newEvent.invitation_link, newEvent);
    await sendTicketEmail(emailTo, title, newEvent);

    // if (add_guests && add_guests.length > 0) {
    //   for (const guest_email of add_guests) {
    //     try {
    //       await sendInvitationEmail(guest_email, newEvent.invitation_link, newEvent);
    //     } catch (emailError) {
    //       console.error(`Failed to send invitation guest email: ${emailError.message}`);
    //     }
    //   }
    // }

    const savedEvent = await newEvent.save();

    res.status(201).json({ message: "Event created successfully", savedEvent });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to create event", errorMsg: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      title,
      description,
      event_date,
      start_time,
      end_time,
      number_of_guests,
      venue,
      add_guests,
    } = req.body;
    const imageFile = req.file;

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        title,
        description,
        event_date,
        start_time,
        end_time,
        number_of_guests,
        venue,
        add_guests,
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

export const getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const offset = (page - 1) * limit;

    const events = await Event.find()
      .limit(parseInt(limit))
      .skip(offset)
      .sort({ createdAt: -1 });

    const totalEvents = await Event.countDocuments();
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

export const read = async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug });
    if (!event) {
      return res.status(404).json({ error: "event not found" });
    }
    res.json(event);
  } catch (err) {
    return res.status(400).json(err.message);
  }
};

export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }

    res.status(200).json({ message: "Event retrieved successfully", event });
  } catch (error) {
    res.status(500).json({
      error: `Server error, please try again later.`,
      errorMsg: error,
    });
  }
};

export const getEventsByHostId = async (req, res) => {
  try {
    const hostId = req.user._id;
    const { page, limit } = req.query;
    const { page: offset, limit: count } = preparePagination(page, limit);

    const userEvents = await Event.find({ host_id: hostId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(count)
      .populate("host_id", "name");

    const totalEvents = await Event.countDocuments({ host_id: hostId });

    const totalPages = getTotalPages(totalEvents, count);

    res.status(200).json({
      message: "User events retrieved successfully",
      totalPages,
      totalEvents,
      userEvents,
    });
  } catch (error) {
    res.status(500).json({
      message: `Server error, please try again later.`,
      errorMsg: error.message,
    });
  }
};


export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    res.json({ message: `Event deleted successfully`, deletedEvent });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Failed to delete event", errorMsg: error.message });
  }
};
