import mongoose from "mongoose";

const Schema = mongoose.Schema;

const bookingSchema = new Schema(
    {
        event: {
            type: Schema.Types.ObjectId,
            ref: "Event"
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
    /* timestamps: true, Adds a Created at, and Updated at Field to booking Schema */
);

export default mongoose.model("Booking", bookingSchema);