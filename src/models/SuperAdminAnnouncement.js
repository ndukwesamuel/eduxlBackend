// Import Mongoose
import mongoose from "mongoose";
const { Schema } = mongoose;

// Define the Announcement Schema
// This Mongoose schema reflects the MongoDB document structure you defined.
const superadminAnnouncementSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required for the announcement."],
      trim: true, // Remove whitespace from both ends of a string
      minlength: [3, "Title must be at least 3 characters long."],
    },
    content: {
      type: String,
      required: [true, "Content is required for the announcement."],
      trim: true,
      minlength: [10, "Content must be at least 10 characters long."],
    },
    link: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          // Simple regex to check if it looks like a URL (http/https or app://deeplink)
          return /^(https?:\/\/[^\s$.?#].[^\s]*|app:\/\/[^\s]*)$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid URL or deep link format!`,
      },
      // You can also add specific checks for deep links vs web links if needed
      required: false, // Link is optional
    },
    estateId: {
      // This field now holds an ARRAY of ObjectIds.
      // An announcement can be assigned to multiple specific estates by including their IDs in this array.
      type: [mongoose.Schema.Types.ObjectId], // Changed to an array of ObjectIds
      ref: "Estate", // Assumes you have an 'Estate' model for referencing
      required: false, // Optional, an announcement might be global or have no specific estates
      // If you plan to use this for filtering by estate, ensure it's indexed in MongoDB for performance.
    },
    global: {
      // True if this announcement is visible to all estates/users (overrides estateId filtering).
      type: Boolean,
      default: false, // By default, assume announcements are not global unless explicitly set
      required: false,
    },
    postedBy: {
      // Reference to the user (Super Admin) who posted this.
      // Assumes you have a 'User' model.
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Posted By user is required."], // Super Admin must be identified
    },
  },
  {
    // Mongoose automatically adds createdAt and updatedAt fields
    // if timestamps are enabled. They will be of Date type.
    timestamps: true,
  }
);

export default mongoose.model(
  "SuperadminAnnouncement",
  superadminAnnouncementSchema
);

// Export the model

/*
How to use this model in your Express.js application:

1.  **Ensure Mongoose is connected to MongoDB:**
    (In your app.js or server.js)
    ```javascript
    const mongoose = require('mongoose');
    mongoose.connect('mongodb://localhost:27017/your_database_name', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
    ```

2.  **Import the model into your routes or controllers:**
    ```javascript
    const Announcement = require('./models/Announcement'); // Adjust path as needed

    // Example: Creating a new announcement for specific estates OR as a global announcement
    // For specific estates, req.body.estateIds would be an array of ObjectId strings: ['id1', 'id2']
    // For a global announcement, set global: true and estateIds can be empty or null
    app.post('/api/announcements', async (req, res) => {
      try {
        const { title, content, date, link, estateIds, global, postedBy } = req.body; // Changed 'estateId' to 'estateIds' for array

        // Ensure postedBy is a valid ObjectId (e.g., from an authenticated user)
        if (!mongoose.Types.ObjectId.isValid(postedBy)) {
          return res.status(400).json({ message: 'Invalid postedBy ID.' });
        }

        // Validate estateIds if provided, ensuring they are an array of valid ObjectIds
        if (estateIds && !Array.isArray(estateIds)) {
            return res.status(400).json({ message: 'estateIds must be an array.' });
        }
        const validEstateIds = estateIds ? estateIds.filter(id => mongoose.Types.ObjectId.isValid(id)) : [];

        const newAnnouncement = new Announcement({
          title,
          content,
          date: date ? new Date(date) : undefined, // Convert string date to Date object if provided
          link,
          estateId: global ? [] : validEstateIds, // If global, don't set specific estateIds
          global: !!global, // Ensure global is boolean
          postedBy
        });

        const savedAnnouncement = await newAnnouncement.save();
        res.status(201).json(savedAnnouncement);
      } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: 'Failed to create announcement.', error: error.message });
      }
    });

    // Example: Getting all GLOBAL announcements
    app.get('/api/announcements/global', async (req, res) => {
      try {
        const announcements = await Announcement.find({ global: true }).sort({ date: -1 });
        res.status(200).json(announcements);
      } catch (error) {
        console.error('Error fetching global announcements:', error);
        res.status(500).json({ message: 'Failed to fetch global announcements.', error: error.message });
      }
    });

    // Example: Getting announcements for a specific estate (includes global and targeted)
    // This route would be called by the app for a specific estate's forum.
    app.get('/api/estates/:estateId/announcements', async (req, res) => {
        try {
            const { estateId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(estateId)) {
                return res.status(400).json({ message: 'Invalid estate ID.' });
            }
            
            // Fetch announcements that are either global OR include the current estateId in their estateId array
            const announcements = await Announcement.find({
                $or: [
                    { global: true },
                    { estateId: { $in: [estateId] } } // Use $in operator to check if estateId is in the array
                ]
            }).sort({ date: -1 }); // Sort by date descending
            res.status(200).json(announcements);
        } catch (error) {
            console.error('Error fetching estate-specific announcements:', error);
            res.status(500).json({ message: 'Failed to fetch estate-specific announcements.', error: error.message });
        }
    });

    // Example: Getting a single announcement by ID
    app.get('/api/announcements/:id', async (req, res) => {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid announcement ID.' });
            }
            const announcement = await Announcement.findById(id);
            if (!announcement) {
                return res.status(404).json({ message: 'Announcement not found.' });
            }
            res.status(200).json(announcement);
        } catch (error) {
            console.error('Error fetching single announcement:', error);
            res.status(500).json({ message: 'Failed to fetch announcement.', error: error.message });
        }
    });
    ```
*/
