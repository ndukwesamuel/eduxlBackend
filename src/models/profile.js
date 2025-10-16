import mongoose from "mongoose";

// address schema
const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },
  state: {
    type: String,
    default: "",
  },
});

const userProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    photo: {
      type: String,
      default:
        "https://static.vecteezy.com/system/resources/previews/002/318/271/original/user-profile-icon-free-vector.jpg",
    },
    photoPublicId: {
      type: String,
      default: null,
    },
    pushtoken: {
      type: String,
      default: null,
    },

    currentClanMeeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clan",
      default: null,
    },
    AdmincurrentClanMeeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clan",
      default: null,
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    address: {
      type: addressSchema,
      default: {
        street: "",
        city: "",
        state: "",
      },
      _id: false,
    },
  },
  // { timestamps: true, }

  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Add name at the profile level by pulling from nested user
        if (doc.populated("user") && ret.user?.name) {
          ret.name = ret.user.name;
        }
        return ret;
      },
    },
  }
);

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

export default UserProfile;
