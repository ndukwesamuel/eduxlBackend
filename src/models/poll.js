import mongoose from "mongoose";
const { Schema } = mongoose;

const pollSchema = new Schema(
  {
    clanId: {
      type: Schema.Types.ObjectId,
      ref: "Clan",
    },
    question: {
      type: String,
      required: true,
    },
    options: {
      type: Array,
      required: true, // At least one option for a poll
      of: {
        // Define object structure within the array
        type: Object,
        properties: {
          text: {
            type: String,
            required: true,
          },
          votes: {
            type: Number,
            default: 0, // Set default to 0
          },
        },
      },
    },
    votes: [
      {
        optionText: {
          type: String,
        },

        voterId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export const Poll = mongoose.model("Poll", pollSchema);
