// models/event.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    event_date: {
      type: Date,
      required: true,
    },
    start_time: {
      type: Date,
      required: true,
    },
    end_time: {
      type: Date,
      required: true,
    },
    number_of_guests: {
      type: Number,
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    host_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    photo: {
      type: String,
    },
    add_guests: [
      {
        type: String,
      },
    ],
    invitation_link: {
      type: String,
      default: null,
    },
    categories: {
      type: String,
      enum: ['arts-culture', 'business', 'fashion-design', 'charity-aid', 'community', 'food-drink', 'investment', 'music-performance', 'school-education', 'spiritual-religion', 'government', 'sports-fitness-training', 'technology-science', 'family meeting-marriage', 'all'],
      default: 'all',
    },
  },
  { timestamps: true }
);

eventSchema.virtual('duration').get(function () {
    const start = this.start_time;
    const end = this.end_time;
    const durationInMilliseconds = end - start;
    
    const durationInSeconds = Math.floor(durationInMilliseconds / 1000);
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
  
    let durationString = '';
  
    if (hours > 0) {
      durationString += `${hours} ${hours > 1 ? 'hours' : 'hour'}`;
    }
  
    if (minutes > 0) {
      durationString += ` ${minutes} ${minutes > 1 ? 'minutes' : 'minute'}`;
    }
  
    return durationString.trim();
  });
   

export default mongoose.model('Event', eventSchema);
