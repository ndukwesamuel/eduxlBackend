import mongoose from 'mongoose';
const { Schema } = mongoose;
const { ObjectId } = Schema

const vendorRatingSchema = new Schema({
  user: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  vendor: {
    type: ObjectId,
    ref: 'ServiceVendor',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  review: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model('VendorRating', vendorRatingSchema);
