import mongoose from "mongoose";
const { Schema } = mongoose;

const complaintSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  complaint: {
    type: String,
    require: true,
  },
});

export default mongoose.model("Complaint", complaintSchema);
