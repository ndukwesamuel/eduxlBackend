import mongoose from 'mongoose';

const { Schema } = mongoose;

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
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
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    event_date: {
      type: Date,
      required: true,
    },
    starts: {
      type: Date,
      required: true,
    },
    ends: {
      type: Date,
      required: true,
    },
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    event_type: {
      type: String,
      enum: ['live', 'virtual', 'one-on-one'],
      default: 'live',
    },
    sold_tickets: {
      type: Number,
      default: 0,
    },
    available_tickets: {
      type: Number,
      required: true,
    },
    slug: {
      type: String,
    },
    photo: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model('PublicEvent', eventSchema);
